{
  # main
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # dev
  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = with inputs; [
            fenix.overlays.default
          ];
        };
        wireguard-gui-tauri = pkgs.callPackage ./nix/wireguard-gui.nix { };
      in
      {
        packages.default = wireguard-gui-tauri;
      }
    );
}
