# Document Up your Readme's!

Instantly beautify your Github repositories' `README.md` with DocumentUp. This site has been generated with it.

Essentially, it parses your readme's markdown into a clean and simple documentation website. Made especially for your `gh-pages` branch, all you need is a single `index.html` file that includes the DocumentUp script.*

\* Some configuration required

## Quick dress up

Simple as pie.

```html
<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/documentup/0.1.0/documentup.min.js"></script>
<script type="text/javascript">
  DocumentUp.document("username/repository");
</script>
```

Make sure to change the `"username/repository"` to the repository's name and user's username.

## Usage

### Getting the script

**Recommended**
Use [CDNJS](http://cdnjs.com) with this script `src`: `http://cdnjs.cloudflare.com/ajax/libs/documentup/0.1.0/documentup.min.js`

**Also good**
Download it from this repository There's a minified version of it named `documentup.min.js`

### Instantiation

DocumentUp, in its simplest form, accepts a single argument. A string representing a public repository's "route":

```javascript
DocumentUp.document("username/repository");
```

It can be enhanced with an option object like so:

```javascript
DocumentUp.document({
  repo:  "username/repository",
  color: "green"
});
```

### Options

**repo** (String) *required*
Github repository in the form of `username/repository`

**name** (String) *default: repository name*
Name of your project. It'll appear in the header of the sidebar. Defaults to the `repository` substring of the `repo` option.

**color** (String) *default: "#336699"*
CSS-like color representing the color for the links both in the sidebar and the content.

**travis** (Boolean) *default: false*
Indicate if the project is being tested by [Travis-CI](http://travis-ci.org/). If `true`, it'll add the small travis badge in the sidebar.

**twitter** (String *or* Array of strings) *default: null*
Add follow buttons for one or more Twitter accounts to your sidebar. Useful to gather followers.

## Thank you

Thanks for the few well documented project sites out there for the inspiration.

## License

Copyright (c) 2012 Jerome Gravel-Niquet

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
