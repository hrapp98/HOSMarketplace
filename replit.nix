# Nix configuration for Replit environment
{ pkgs }: {
  deps = [
    pkgs.nodejs_20
    pkgs.npm-9_x
    pkgs.nodePackages.typescript
    pkgs.nodePackages.prisma
    pkgs.git
    pkgs.curl
    pkgs.postgresql
  ];
}