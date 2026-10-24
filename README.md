# Trabalho API TvMaze

As modificações no arquivo README do projeto serão feitas na main puramente por conveniência, sabemos que não seria o ideal.

## Papéis definidos

- Guilherme Vojciechovski: Dados (Modelagem, Banco, Docker)
- Luis Ronei: API (Requisições HTTP e Insomnia)
- Henrique Mengarda: Interface (Frontend e gráficos)

## Como inicializar o MongoDB + RESTHeart via Docker-compose

### Como iniciar o Banco e o RESTHeart

Após clonar o repositório na sua máquina, e certificar que a engine do docker está ativa na máquina, abra um terminal no projeto e execute o seguinte comando:

>docker compose up

Alternativamente, para que o comando seja executado em segundo plano, permitindo que o terminal seja fechado sem encerrar o serviço, execute:

>docker compose up -d

**Com isso, o banco já está funcionando e exposto via RESTHeart na porta 8080, tendo como link base da API: http://localhost:8080/**

## Como enviar requisições ao banco

### Programa necessário

Para poder enviar requisições sem a necessidade de desenvolver o sistema precisamos utilizar um programa que permite enviar requisições diretamente, recomendo o [Insomnia](https://insomnia.rest/download).

## Como fazer uma requisição no Insomnia

Ao iniciar o programa, clique em **Send a request**, isso vai te levar à interface que permite enviar as requisições.

Nessa tela, clique em **Auth** abaixo do campo no qual inserimos o link para a requisição, agora, selecione **Inherit from parent** e altere para **Basic**, nessa tela, preencha as credencias da seguinte maneira:

>**USERNAME:** admin

>**PASSWORD:** secret

**Obs:** Logicamente as credenciais não serão essas no projeto final.

Agora, clique em **Headers**, e adicione um novo cabeçalho nomeado **Content-type** com o valor **application/json**, e pronto, agora é possível enviar requisições normalmente.

Para testar, envie essa requisição para criar uma coleção:

>**Método:** PUT

>**Link:** http://localhost:8080/colecao

E então, clique em **Send**, se tudo estiver correto, na direita haverá o retorno **201**, indicando que o recurso foi criado, portanto, também indicando que o banco está funcionando corretamente.