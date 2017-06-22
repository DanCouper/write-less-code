# Some UI Components

All components are in individual folders under `./public/`.

Can just open the individual `index.html` files, but preferably use
a server, _eg_ on an environment with Python installed, use

```
> cd public
> python -m SimpleHTTPServer
```

To serve from that directory.

## Developing

Run `yarn` to install deps.

Bit janky atm, ideally public should not exist until built. Until then,
any JS or CSS should be written in the relevant subdirectory in the `./src/`
folder, and compiled using the `yarn build` command. The directory structure must
match the expected output structure in public.
