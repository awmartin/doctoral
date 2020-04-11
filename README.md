# Doctoral

Doctoral is a document app _a la_ Dropbox Paper and Google Docs built with privacy in mind.

It's backed by Google Cloud Firebase and runs with open source Vue.js components.

It supports several popular editors (CKEditor, Quill, Editor.js). Licensing the one you want is up to you.

## Why?

I like online text editors a lot, like Google Docs and Dropbox Paper, but I've always felt a bit odd about having big companies hosting my data. Paper also creates docs with world-readable premissions by default, and Dropbox itself has a number of security issues to this day that remain unaddressed. And if one were to ever lose access to their Google account, the impact could be disastrous.

So I made Doctoral to enable anyone with a bit of tech-savviness to host their own online document editor, so at least they can control their own content. On the roadmap will be capabilities to enable hosting without Firebase, but for now, at least it's your GCP account and your database.

The app is just a minimal document editor and organizer with sharing, publishing, and folders. That's it. If you're a coder, you can use this as a foundation for your own docs editor.

I may even wrap this in Electron so folks can have a desktop version.
