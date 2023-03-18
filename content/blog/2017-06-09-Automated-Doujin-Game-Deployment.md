+++
title = "Automated Game Deployment"
tags = ["deployment", "doujin", "indie", "game-dev"]
+++

A good game is often built on the solid feedback from playtesters. The tighter
the feedback loop for a game, whether it be in development or production, the
faster the developers can collect and iterate on feedback and bug reports.

Most game devs in the beginning will do periodic builds after long periods of
isolated development, asking their testers to download the whole game repeatedly
to test fixes and updates. While this works initially, this takes signifigant
focus from the developer to create builds and distribute them manually to the testers. This methodology is also flawed when the game is released. Bugs will inevitably pop up: telling players who have already spent time to download a
potentially large (1-5GB+) game each time there is a minor update is simply
unacceptable. For indie developers, you could probably use
Steam or similar services to patch and deploy new changes; however, many of
these services can be [prohibitively
expensive](http://kotaku.com/5884842/wait-it-costs-40000-to-patch-a-console-game)
for small indie studios to use. For doujin developers who may or may not be
creating derivative works without the luxury of these services, we're more or
less on our own: there is no exisitng support structure for this kind of
service.

To remedy these problems, we will apply the principles of **continuous
integration** and **continuous deployment**.  The end goal is to produce an
automated pipeline: when a developer makes a change, the game is
built, tested, and deployed to player's desktops and
browsers. Spending time to manually do all of the following is simply draining
time you could be spending improving your game.

# Basic Setup
At it's core, this automated pipeline needs four things: **a queryable source
control repository**, **an automated build system**, **a deployment web server**
, and a **client side launcher/updater**.

The automated build system will listen to source control for changes. When
notified, it will automatically start building your game in accordance to your
specifications. If the build and tests succeed, the goal is to notify the
deployment server to make the built artifacts publicly available. The client
launcher then checks if the game files are outdated at launch, and updates the
game as needed.

## Source Control
It all begins with the source control. Any good developer worth their salt,
makes sure to version control their work. I won't go too much into detail as
there are entire books and methodologies written about good source control.
For the sake of this article, the only hard requirement is that the source
control service either can automatically notify 3rd parties about pushed
updates, or can be periodically queried for changes. There are plenty of services
out there that can satisfy requirement: [GitHub](https://github.com),
[BitBucket](https://bitbucket.com), [GitLab](https://gitlab.com), [AWS
CodeCommit](https://aws.amazon.com/codecommit/), etc. Simply choose one that
suits your needs and push your source to a repository. For my case, [my
project](https://github.com/HouraiTeahouse/FantasyCrescendo) lives in a Github
repository.

NOTE: Most of these services are free for open source software, while putting a
limit on private use. If you wish to keep your game closed source, there will be
costs involved at this stage.

## Automatic Builds (Continuous Integration)
The next step is to trigger automatic builds based on source control changes.
This part also usually involves simply choosing the right service for your game.
There is [AppVeyor](https://www.appveyor.com) (Windows) and
[TravisCI](https://travis-ci.org) (macOS and Linux) for free and open source
projects. If you cannot use either for whatever reason, you can always roll your
own instance via [Jenkins](https://jenkins.io/index.html) or
[BuildBot](http://buildbot.net/). For Unity3D games, I strongly recommend
[Unity Cloud Build](https://build.cloud.unity3d.com) as setting up a Unity build
enviroment in any of these other CI systems can be very slow and costly.

NOTE: Again most of these services are free for open source software, if your
game is closed source, be prepared to pay up some money, or you may need to do
additional configuration so that these services have the proper authentication
to access your source control.

## Automatic Deploymment
You now have a automatic stream of game builds coming in now. Now comes the
hard part: exposing these files in a public manner for the client to query
against. To my knowledge, there is no public free service that does this: so I
rolled [my own](https://github.com/HouraiTeahouse/HouraiDeploy). HouraiDeploy is
a tiny Flask web app that does the following:

 * Expose a HTTP endpoint for receiving notifications from automatic deployment
 * On being notified, it either:
   * Clones a copy of the source control for itself, and rebuilds the project
     locally using the same build process used in the CI build. This is for
     security, as it ensures others cannot upload malicious "build artifacts"
     that ultimately will end up executed on player's computers.
   * Download copies of build artifacts from trusted parties. This is usually
     used when the build process is either too complex or too computationally
     intensive to do locally (i.e. Unity3D builds).
 * Upon obtaining the files, it places them in a location accessible by a
   [nginx static file server](https://www.nginx.com/resources/wiki/), which then
   serves the files to remote clients.
 * It then generates an **index file** for clients to query. More details down
   below.

For added security, HouraiDeploy also checks for an privately generated access
token in the HTTP request. These tokens are only stored on the host itself, and
as encrypted enviroment variables on the continuous integration system's end.

### Generating a Index
The updater works effectively by checking each individual file against a remote
index. This index includes the file's path, size, and SHA-256 hash (though any
hash would work, it's advised to use SHA-2 or better. As MD5 and SHA-1 have been
known to be cracked and/or faked before). The hash is a quick and simple way to
check if files are identical. If the file exists at a path exists locally, and
has a matching size and file hash, it's almost 100% guarenteed that the files
are identical, and thus does not need to be redownloaded. If the hash changes,
we simply update the file by downloading the remote version and replacing the
local one with it. For HouraiDeploy, we get the file hashes like so:

```python
from hashlib import sha256
def hash_file(path, block_size=65536):
  hahser = sha256()
  with open(path, 'r') as file_obj:
    for block in iter(lambda: file_source.read(block_size), b''):
      hasher.update(block)
  return hasher.hexdigest()
```

This method also minimizes the amount of data needed to update the game: a
index with ~120 files, irrespective of file size, is only 20kb, saving you the
bandwidth cost and the player's time from needing to serve or download
unnecessary data.

We generate one of these indexes for the game each time a new build is
completed, and it is saved as a file right next to the game data.

An example of such a index file can be seen
[here](https://patch.houraiteahouse.net/fantasy-crescendo/develop/Linux/index.json).

## Client Side Launcher
This one is a tough one: we want to create an efficent cross-platform
downloader with a responsive UI that can work with the index and files we
generate. Obviously nothing will work off the bat with the freshly created
Hourai Deploy, so I created
[Hourai Launcher](https://github.com/HouraiTeahouse/HouraiLauncher),
a sister project that reads Hourai Deploy compatible index files and updates
local files. It's created using Python: PyQt provides a cross platform GUI, and
PyInstaller creates standalone executables so that players don't need to have a
python runtime to run it. At it's core Hourai Launcher is a script for
downloading and updating the game, everything else is to get it to work nicely
with a responsive UI. A more barebones update script can be done as follows:

```python
# For downloading files to disk
def download_file(url, file_path, block_size=1024*1024):
  with open(file_path, 'wb+') as file:
    # Remember to stream this
    reqponse = requests.get(url, stream=True)
    for block in iter(lambda: file_source.read(block_size), b''):
      file.write(block)

# Index local files
game_index = dict()
replacement = GAME_BASE_DIR + os.path.sep
for directory, _, files in os.walk(GAME_BASE_DIR):
  for file in files:
    full_path = os.path.join(directory, file)
    relative_path = full_path.replace(replacement, '')
    # Use same hashing function mentioned earlier
    game_index[file] = hash_file(full_path)

# Fetch remote index using requests library
import requests
index_json = requests.get(INDEX_URL)

# Download missing or improper files
for file, data in index_json['files']:
  url = build_url(game_index, data)
  path = os.path.join(GAME_BASE_DIR, file)
  if file not in game_index:
    download_file(url, path)
  elif game_index[file] != data['sha256']:
    download_file(url, path)

# Remove unneeded files
for file, hash in game_index:
  if file not in index_json['files']:
    os.remove(os.path.join(GAME_BASE_DIR, file)
```

Bonus: There's some extra space available on the UI, so I added a news list to
help list the news regarding the game from a RSS feed.

# Refinement and Improvement
Now that we have a basic system set up, there are a number of smaller problems
that should probably be addressed to ensure the system runs as smoothly as
possible.

## Supporting Multiple Branches
Why would we want to support multiple branches? Ask Blizzard: *Overwatch* and
many other games have a closed beta, open beta, endless beta, public test region
(PTR), etc. This allows you to isolate different deployment enviroments and lets
players have multiple installations on your machine: a publicly released
version, or the latest test beta. This supports development workflows like
[Gitflow](https://datasift.github.io/gitflow/IntroducingGitFlow.html) where
there are multiple historical branches of development, which are known to help
avoid introducing momentary bugs when creating new features.

This is relatively simple, additional space and directories simply need to be
allocated on both the players' machines and on the deployment host, with
additional configuration to Hourai Launcher and Hourai Deploy for this. When
multiple branches are configured, the UI will expose a selector box for choosing
which version of the game to use.

## Caching and Cache Busting
There is one large caveat to our current setup: it can become exceptionally
bandwidth heavy quickly, even with compression. A 5GB game with 1000 clean
installs is 5TB of bandwidth used. This easily can get to $100 to
$1000+ per month for just bandwith (depending on where and how you are hosting
your game files).

The solution is to use a CDN (Content Delivery Network) to cache the game files.
Instead of hammering your file server with heavy requests, requests for already
cached files end at the CDN, signifigantly reducing For added benefit, good
CDNs geographically replicate your data, meaning download speeds are more
uniform, regardless of geographic location. Currently at time of writing,
HouraiDeploy assumes the static file server is behind
[CloudFlare](https://cloudflare.com): a free CDN service that doubles as DDoS
protection. In the case of Hourai Teahouse, we set up the Page Rules for
https://patch.houraiteahouse.net to very aggressively cache files:

 * **Cache Everything** - every file served from the domain is cached
 * **Browser Cache TTL: 1 year** - browsers and clients should keep the file
   cached for a full year, and assume the file has not changed.
 * **Edge Cache TTL: 1 month** - If a file is cached on CloudFlare's servers, it
   will not check for a change in the file until a month later.

The combination of these three drastically reduce the amount of bandwidth used:
CloudFlare will likely fetch a file once and only once from the host. All other
requests will be handled entirely by CloudFlare itself.

However, these aggressive caching rules presents a problem: updated files are
not served if they are on the same path. For example, if the base binary
`fc.exe` was fetched and cached on June 1st 2017, but then updated 7 days later,
CloudFlare will assume nothing has changed until July 1st 2017, serving the old
fc.exe, despite the base file changing. There are two ways of dealing with this
issue: **cache invalidation** and **cache busting**.

Cache invalidation involves explicitly telling CloudFlare or any other CDN that
the cached file is now invalid, forcing it to refetch and recache the file.
CloudFlare has explicit
[REST API endpoints](https://api.cloudflare.com/#zone-purge-individual-files-by-url-and-cache-tags)
for this purpose. There are some caveats to this: this endpoint is limited to
2000 calls per 24 hours, so it's not well suited for doing purges of large
groups of files. It is however, incredibly useful for invalidating fixed API
endpoints, like the generated index.json file. Hourai Deploy actively uses this
calls this endpoint to invalidate these kinds of files.

If cache invalidation does not work on large groups of files, cache-busting does
a much better job. The idea is not to invalidate the files server side, but
rather force the client to fetch from a location that will intentionally miss
the cache. To do this, we simply need to alter the URL for a file to include a
static "change identifier". This identifier should be the same so long as the
binary content of the file is the same, and should be drastically different if
there is even a small change in the content. A simple solution is to append the
SHA-256 hash which we previously computed for index.json to the filename. For
example, `fc.exe` now becomes
`fc.exe_142ac6014584d99e0a520145f142e176fe200bec431d9cc96029ef058ac34f01`. As
this hash will change signifigantly when the file changes even slightly, so will
the URL, forcing a cache miss each time there is a new file.
If the file has not changed, the URL remains the same, allowing
full use of the cache. It should be noted that old cached versions of files will
remain in the cache with this technique. Hourai Deploy automatically appends file
hashes, and Hourai Launcher will build the URL accordingly to incorporate the
hash.

The end strategy is thus to invalidate the index.json each time it's updated, in
which it includes the data needed to build the appropriate cache-busting URL to
fetch new files.

