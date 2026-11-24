{
  description = "Ambiente de desarrollo de SiPer";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      herramientas = [
        pkgs.nodejs_22
        pkgs.postgresql_18
        pkgs.git
      ];
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = herramientas;
        shellHook = ''
          if ! . pg-env.sh; then
            echo "No se encontro pg-env.sh en el PATH"
          elif [ ! -f local-config.yaml ]; then
            echo "El ambiente no esta instalado: no existe local-config.yaml"
          elif [ ! -d "$PGDATA" ]; then
            echo "El ambiente no esta instalado: no existe la instancia de PostgreSQL en local-pg/data"
          elif [ -z "$PGPORT" ]; then
            echo "No se pudo leer db.port de local-config.yaml"
          elif ! start_pg_if_stopped; then
            echo "Fallo el inicio de PostgreSQL, el detalle esta en local-pg/postgres.log"
          fi
        '';
      };

      apps.${system}.install = {
        type = "app";
        program = "${pkgs.writeShellApplication {
          name = "install";
          runtimeInputs = herramientas;
          text = "install-dev-env";
        }}/bin/install";
      };
    };
}
