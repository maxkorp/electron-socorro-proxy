This server code literally just proxies in crash reports coming in to
crash.mysite.com, and modifies the body to say ensure that
`ProductName` and `Version` are properly set. Socorro expects a different
case (`ProductName` vs `productname` for example) than electron crash-reporter
provides, and trying to add those to the `extra` field in crash reporter seems
to be ommitted, while other fields are not. So, we are left with this.

This is all very stupid.

I've also added docs and default configs in the install directory. 
