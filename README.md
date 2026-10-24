# Trabalho API TvMaze

As modificações no arquivo README do projeto serão feitas na main puramente por conveniência, sabemos que não seria o ideal.

## Papéis definidos

-Guilherme Vojciechovski: Dados (Modelagem, Banco, Docker)
-Luis Ronei: API (Requisições HTTP e Insomnia)
-Henrique Mengarda: Interface (Frontend e gráficos)

## Entrega 1: Docker-compose com MongoDB + RESTHeart

### Como iniciar o Banco e o RESTHeart

Após clonar o repositório na sua máquina, e certificar que a engine do docker está ativa na máquina, abra um terminal no projeto e execute o seguinte comando:

'''docker compose up'''

Alternativament, execute:

'''docker compose up -d'''

Para que o comando seja executado em segundo plano, permitindo que o terminal seja fechado sem encerrar o serviço.

*Com isso, o banco já está funcionando e exposto via RESTHeart na porta 8080, e tem como link base da API: http://localhost:8080/*