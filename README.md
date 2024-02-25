<div align="center">
  <h1>Wireguard GUI</h1>
  <h3>❤️ Made with love with Nextauri ❤️</h3>

<p>

[![Stars](https://img.shields.io/github/stars/leon3s/wireguard-gui?style=social)](https://github.com/leon3s/wireguard-gui)
[![Rust](https://img.shields.io/badge/built_with-Rust-dca282.svg)](https://github.com/leon3s/wireguard-gui)
[![Typescript](https://img.shields.io/badge/built_with-Typescript-3178C6.svg)](https://github.com/leon3s/wireguard-gui)
[![Discord](https://img.shields.io/discord/1011267493114949693?label=chat&logo=discord)](https://discord.gg/WV4Aac8uZg)

</p>

<p>

[![Eslint & Clippy](https://github.com/leon3s/wireguard-gui/actions/workflows/eslint_clippy.yml/badge.svg)](https://github.com/leon3s/wireguard-gui/actions/workflows/eslint_clippy.yml)
[![Build](https://github.com/leon3s/wireguard-gui/actions/workflows/build.yml/badge.svg)](https://github.com/leon3s/wireguard-gui/actions/workflows/build.yml)

<p>

<img src="./public/img/app.png" />

</div>

## ❓ What is Wireguard GUI ?

Wireguard GUI is a Debian/Linux application that allow you to manage your Wireguard VPN configuration.

## 💡 Features

- [x] List all profile
- [x] Add a new profile
- [x] Edit a profile
- [x] Remove a profile
- [x] Start a profile
- [x] Stop a profile
- [ ] Import a profile
- [ ] Export a profile

## 💪 Motivation

I didn't found any GUI application that allow me to manage my Wireguard VPN configuration. <br />
I wanted to make an application with nextauri since a while, so i took this opportunity to make it.

## 📦 Installation

Release are currently only available as a .deb package for Debian/Ubuntu.
It can be found on the [release page](https://github.com/leon3s/wireguard-gui/releases/latest)

## 🚀 Demo

A demo will be recorded soon.

## 🎨 Developing

Be sure you have [NodeJS](https://nodejs.org/en/) and [Rust](https://www.rust-lang.org/) installed on your system

1.  See Tauri [prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites/) to prepare your system to build `Tauri`

2.  Clone or fork this repository
    ```sh
    git clone https://github.com/leon3s/wireguard-gui
    cd wireguard-gui
    ```
3.  Install node dependencies
    ```sh
    npm install
    ```

To get started you only need one command

```sh
npm run dev
```

## ⚡Production

To build in production you can do it in a single command.
This will build and export Next.js and build Tauri for your current environnement.

```sh
npm run tauri build
```

## 📚 Documentation

To learn more about Tauri and Next.js, take a look at the following resources:

- [Tauri Guides](https://tauri.app/v1/guides/) - guide about Tauri.
- [Tauri API](https://tauri.app/v1/api/js) - discover javascript Tauri api.
- [Next.js Documentation](https://nextjs.org/docs) - learn more about Next.js.
- [Next.js Tutorial](https://nextjs.org/learn) - interactive Next.js tutorial.
