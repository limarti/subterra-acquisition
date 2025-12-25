# gla-app

## Project Setup 
### Ensure to have installed the following dependencies

1. node version manager (nvm)
2. yarn 1.22.22
3. Android studio for android simulation


### Setup

1. run `nvm use` to use proyect .nvmrc. Alternative you could use node version 22.14.0
2. run `yarn` or `yarn install`


### Compile and Hot-Reload for Development

```javascript
npm run dev:web
```

### Build project

```javascript
npm run build
```

### Open app in android studio (android studio required)
```javascript
npm run dev:android
```
This will be opening android studio and start importing the android project after some questions

### Run tcp server
On the project root type
1. `cd tcp-server`
2. `node socket-server`