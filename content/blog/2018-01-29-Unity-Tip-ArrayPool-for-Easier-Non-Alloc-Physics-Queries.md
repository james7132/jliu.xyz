+++
title = "Unity Tip: ArrayPool for Easier Non Alloc Physics Queries"
tags = ["unity3d"]
+++

Here's a quick tip. In the upcoming Unity 2018.1 beta, they've recently added
support for .NET Standard 2.0 profile. This includes `System.Buffers.ArrayPool`
class. ArrayPool acts as a managed pool of strongly typed arrays. This class can
be particularly useful when working with the \*NonAlloc Unity Physics queries, as
they require an array as an input.

Before, you likely had code like the following:

```cs
const int kCacheSize = 256;
Collider[] colldierCache; // Member variable to the script as a cache

void Awake() {
  colliderCache = new Collider[kCacheSize];
}

void CheckSphere(...) {
  int colliderCount = Physics.OverlapSphereNonAlloc(..., colldierCache, ...);
  for (int i = 0; i < colliderCount; i++) {
    ...
    // Process colldier here
    ...
  }
}
```

The overhead of needing to manage a member variable as a cache can be quite
cumbersome, especially when it's an operation as common as raycasting. The
previously shown code can be rewritten like so:

```cs
using System.Buffers;

void CheckSphere(...) {
  const int kCacheSize = 256;
  var arrayPool = ArrayPool<Collider>.Shared;
  Collider[] colliderCache = arrayPool.Rent(kCacheSize);
  int colliderCount = Physics.OverlapSphereNonAlloc(..., colldierCache, ...);
  for (int i = 0; i < colliderCount; i++) {
    ...
    // Process colldier here
    ...
  }
  arrayPool.Return(colliderCache);
}
```

Some things to consider:

 * This can further reduce memory allocations by reusing arrays across different
   operations. (i.e. an allocated array returned from one operation can be used
   in a completely different context).
 * The size of the rented array may be larger than the requested size.
 * If the pool is empty, it will allocate an array of the requested size.
 * You do not need to make sure to return the array. The pool will continue to
   operate normally even if none of the rented arrays are never returned.
 * Arrays not returned to the pool will eventually just get collected by GC.
 * The pool is bucketed based on array size, if a bucket is full, a returned
   array will not be added back to the pool.
