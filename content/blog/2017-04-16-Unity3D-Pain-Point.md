+++
title = "Unity3D Pain Points"
tags = ["unity3d"]
redirect_from = "//2017-04-16-Unity3D-Pain-Points"
+++

**Unity3D** has risen up from small startup to one of the largest players in the
game industry. The design of the engine and editor are well suited for allowing
those who with little prior technical knowledge to create wonderful games.
However, whether it's due to legacy code or simply bad design, there is a
plethora of pain points in working with the engine. In this post, I will enumerate
many of the big problems I have personally encountered as a software developer
working in Unity3D: a wishlist of things that I hope Unity Technologies
reprioritizes and addresses as soon as possible. This list is by no means
comprehensive, there are plenty of other big issues that need to be dealt with.

Note many of these are widely recognized problems, and Unity Technologies seems
to have three main ways of dealing with them:

 * Dedicate engineering time to resolving them. These will appear in the
   [Unity Roadmap](https://unity3d.com/roadmap).
 * Integrating 3rd party solutions, either via offering formerly for-pay Asset Store
   packages for free, or directly integrating it into the engine and providing
   first party support (see SpeedTree and TextMeshPro).
 * Leaving it up to Asset Store publishers to cover for problems with the engine
   as the de facto standard solution. This presents a particular issue if these
   packages aren't free, as they essentially become mandatory costs when developing
   a new project. It begs the question: why isn't it a part of the engine?

# Case 1: An Outdated Mono
It's 2017: 15 years after the release of C# 4.0. Microsoft just released C# 7.0
in March, yet Unity still only uses C# 4.0. In the following versions of C# 5.0
and C# 6.0, many new language constructs dramatically simplify the development
process: particularly the "new" async/await support. Compatibility with newer
standards will also allow use of the large repository of packages on Nuget: some
outright replaces some Unity specific APIs (i.e. System.Net.Http could very well
completely replace UnityWebRequest). Other features such as expression-bodied
properties, would make code written for Unity games much more readable.

Note: There has been a very large effort on Unity Technologies end to modernize
their scripting engine. They've stated that by the time they're done, Unity will
support all .NET Standard 2.0 features.
This is simply a waiting game at this
point.

# Case 2: Poor API Design
In general there are many design decisions with the API that make writing
code for Unity projects an absolute pain. These problems are fairly prevalent
throughout the engine and aren't strictly localized to any one part.

### Testing Support
Unity pushes developers to design the projects with GameObject-Component
composition over traditional object-oriented techniques like polymorphism.
While I agree that this is a smart choice in giving designers great freedom in
how they compose their game elements, this is undeniably a poor choice when it
comes to creating valid tests. When writing a new MonoBehavior, you
intrinsically pulls in a massive dependency on the GameObject it's attached to,
it's sibiling components, and potentially the rest of the engine. This is a
dependency that provides no surface to mock or fake. MonoBehaviours also require
direct engine integration to trigger their initialization (via `Awake`and
`Start`) instead of using normal constructors. To compensate, every
MonoBehaviour must be tested using reflection or must wrap a unit testable POCO.
Either way that creates a situation where every unit test must have a
corresponding integration test. Not an ideal situation when you simply want to
affirm your game is working as intended.

Worse yet, many of the important functions in Unity's API are unmockable static
functions that either requires or manipulates the global engine or editor state.
For example, almost all methods exposed under `UnityEditor.AssetDatabase` are
intrinsically tied to the actual files managed by the Unity project, which
requires one additional mock method object to be injected into the for every
method mocked.

Many have argued in the past that games are intrinsically hard to test. There is
a combinatorial state space, with each new game feature multiplicatively increases
potential setups to test against. I agree that this is definitely a problem, but
it shouldn't deter people from writing proper tests to ensure their game is
working properly. The idea for a test is to ensure that functionality is not
broken, to assure that when a bug is fixed, it remains fixed. However with this
current setup, you have to go explicitly out of your way to properly build a
reasonable test suite for your game logic.

### Boilerplate Code
Unity's base system makes it easy to do certain tasks, but at the same time,
they promote bad practices. For example, exposing a varible to the editor
requires the field either to be exposed as a public field, or be annotated with
the `SerializeField` attribute. The former is an anti-pattern, and the latter
requires get-only fields to be wrapped in a public get-only property. For
example:

```cs
// The Unity advised way, bad practice in C#
public int ExposedField = 23;

// Good practice, but much more boilerplate
[SerializeField]
private int _exposedField = 23;

public int ExposedField {
  get { return _exposedField; }
  private set { _exposedField = value; }
}
```

This makes the code less readable, and makes the process confusing to both new and
experienced programmers.

```cs
// This is what it could be instead. (Assumes updated Mono)
// Better yet, it could even go without the attribute,
// and just serialize all public serializable properties
[SerializeProperty]
public int ExposedField { get; } = 23;
```

### Async Support
Asynchronous programming in Unity has traditionally done via Coroutines, which
are a thin wrapper around C#'s iterator blocks, checked at fixed times in the
engine's execution order.

```cs
// Starting coroutines requires calling the
// MonoBehaviour method, StartCoroutine
StartCoroutine(TestCoroutine(5));

// Coroutines return an IEnumerator
IEnumerator TestCoroutine(int y) {
  // Run synchronous code
  int x = y + 5;
  // Yielding anything other particular yield
  // instructions causes the coroutine to wait a
  // single frame.
  yield return null;
  // Yield instructions customize how long to yield
  // execution.
  yield return new WaitForSeconds(4);
  // Yielding another coroutine
}
```

There are a number of problems with this approach to asynchronous programming:

 * Yielding doesn't actually release control over the game's main thread. It
   simply tells it to poll for whether the yield instruction is over, and
   continue normal execution when it's done.
 * Coroutines are not easily composable.
 * Since they are required to return a `IEnumerator`, Coroutines cannot return
   anything, and must influence the state of the game purely through the side
   effects of the function itself.
 * The `StartCoroutine` forces all asynchronous programming to be tied to a
   MonoBehaviour.

The very fact that there multiple promise libraries and Coroutine enhancing packages
on the Unity Asset store and Github is a good sign that there are serious issues
with how Unity handles async functionality.

The ultimate end-all-be-all solution would to privde full
`System.Threading.Tasks` support within Unity, along with the `async`/`await`
syntax provided by C# 5.0. This further reinforces the need for Unity to update
it's Mono runtime.

### Multithreading Support
Unity is notorious for being a single threaded engine. Numerous API calls will
error out if called from any thread other than the main thread. Some things as
simple as accessing a `Transform`'s position from a worker thread throws
show-stopping errors. It's pretty clear why they did it too:

 * Adding thread-safe checks to various Unity components can have a negative
   impact on single-threaded performance.
 * For new game developers and new programmers, learning and managing the
   nuances of multithreaded code can be highly negative experince.

These problems are supposed to be allievated by the supposed job system that
Unity Technologies has been working on since 2014. While we have seen the
fruit of their work on it through improvements to the rendering and
particle systems, there has been no information regarding when it will be
released to the public, or how might developer utilize it.

# Case 3: No Multiproject Management
Right now, Unity staticaly compiles all assets into one cohesive standalone
build. This holds for both code and non-code assets. All C# code usually is
compiled into Assembly-CSharp.dll. All assets are built into statically packed
resouce packs. Other code must be included in the form of compiled DLLs in the
source files. This produces particular issues when the project's codebase grows
larger and larger. The instant reloads slowly get longer and longer,
particularly as Unity's compiler currently does not support incremental
compilation: it spends a large amount of time compiling code that usually never
chnages.

On the asset side, Asset Bundles do largely resolve the monolithic static build
issue; however, they introduce a whole new layer of complexity most games and
projects cannot afford to pay attention to, and the support from the game
engine, deployment services, and the community as a whole leaves a lot to be
desired.

For anyone working with a rapidly growing, or already large project, it's
painfully obvious how Unity doesn't scale well here.

# Case 4: No Package Manager
This ties into the previous point: Unity has no support for packaged inclusion
of non-local content. Currently Unity's package system is simply a compressed
archive of assets and their respective project paths, which Unity simply unpacks
into the main project for it to be statically compiled into the end product. Virtually
every other software system has some form of package manager that allows maintainers to
define a simple text list of dependenices and their versions a project depends
on: Java/Gradle, NodeJS/npm, C#/Nuget, etc.

Currently, managing large projects with a large number of dependencies requires
directly copying the source into source control, keeping compiled binaries of
said dependencies in source control, or using methods like git submodules. This
makes updating dependencies difficult, complicates the source control workflow,
or both.

The simplest solution is a first party integration between Unity and Nuget:

 * This would allow developers to remove "hard-included" dependencies from their repos.
 * Developers can then push common shared packages between projects.
 * Allows easy inclusion and use of general purpose third party dependencies like
   `Newtonsoft.Json`

## Conclusion
Despite all the problems I've enumerated with Unity, it is a great engine with a
great community of developers, creating some of the best games out there today.There
are just a few notable pain points in working with the engine that deserve a
serious look at. Pain points that I sincerely hope get dealt with sooner rather
htan later.
