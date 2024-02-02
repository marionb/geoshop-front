# Geoshop Frontend

This is meant to work with a geoshop-backend: https://github.com/sitn/geoshop-back

## Requirements

 * Node >= 18
 * @angular/cli
 * typescript

## Getting started without Docker

```sh
npm i
```

Copy `src\assets\configs\config.json.tmpl` to `src\assets\configs\config.json` in order to configure your app.

Typical values for dev purposes are:

```json
  "apiUrl": "https://sitn.ne.ch/geoshop2_prepub_api",
  "mediaUrl": "https://sitn.ne.ch/geoshop2_prepub_media/images",
```

then:

```sh
npm start
```

## With Docker:

An `.env.sample` is provided as an example.
