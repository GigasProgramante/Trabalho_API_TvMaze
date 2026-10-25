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

### Como fazer uma requisição no Insomnia

Ao iniciar o programa, clique em **Send a request**, isso vai te levar à interface que permite enviar as requisições.

Nessa tela, clique em **Auth** abaixo do campo no qual inserimos o link para a requisição, agora, selecione **Inherit from parent** e altere para **Basic**, nessa tela, preencha as credencias da seguinte maneira:

>**USERNAME:** admin

>**PASSWORD:** secret

**Obs:** Logicamente as credenciais não serão essas no projeto final.

Agora, clique em **Headers**, e adicione um novo cabeçalho nomeado **Content-type** com o valor **application/json**, e pronto, agora é possível enviar requisições normalmente.

### Enviando uma requisição

Para testar, envie essa requisição para criar uma coleção:

>**Método:** PUT

>**Link:** http://localhost:8080/colecao

E então, clique em **Send**, se tudo estiver correto, na direita haverá o retorno **201**, indicando que o recurso foi criado, portanto, também indicando que o banco está funcionando corretamente.

>Tenha em mente que esse teste não é necessário caso você pretenda executar o teste completo descrito nas próximas seções.

## Modelo do documento JSON

Cada série é gravada como um documento na coleção `series`, dentro do banco `tvmaze`. O documento base de teste fica em [`testes/serie-exemplo.json`](testes/serie-exemplo.json):

```json
{
  "tvmazeId": 1,
  "nome": "Under the Dome",
  "tipo": "Scripted",
  "idioma": "English",
  "generos": ["Drama", "Science-Fiction", "Thriller"],
  "status": "Ended",
  "estreia": "2013-06-24",
  "duracaoMin": 60,
  "notaTvmaze": 6.5,
  "emissora": { "nome": "CBS", "pais": "United States" },
  "imagem": "https://static.tvmaze.com/uploads/images/medium_portrait/81/202627.jpg",
  "favorito": false,
  "minhaNota": null,
  "comentario": "",
  "criadoEm": "2026-10-24T14:00:00.000Z",
  "atualizadoEm": "2026-10-24T14:00:00.000Z"
}
```

| Campo | Tipo | Origem |
| --- | --- | --- |
| `tvmazeId`, `duracaoMin`, `notaTvmaze` | número | TVmaze (`id`, `runtime`, `rating.average`) |
| `nome`, `tipo`, `idioma`, `status`, `imagem` | texto | TVmaze |
| `estreia` | data | TVmaze (`premiered`) |
| `generos` | lista embutida | TVmaze (`genres`) |
| `emissora` | objeto embutido | TVmaze (`network` ou `webChannel`) |
| `favorito`, `minhaNota`, `comentario`, `criadoEm`, `atualizadoEm` | campos do grupo | não existem na API |

## Testando o banco com o JSON base

Com o ambiente rodando (`docker compose up -d`) e o Insomnia configurado como explicado acima (Auth **Basic** `admin`/`secret` e header `Content-Type: application/json`).

**Atenção à URL:** o nosso `docker-compose.yml` expõe todos os bancos do MongoDB na raiz, então a URL segue o formato `http://localhost:8080/{banco}/{coleção}`. O nosso banco é `tvmaze` e a coleção é `series`.

### 1. Criar o banco — PUT (201)

>**Método:** PUT

>**Link:** http://localhost:8080/tvmaze

### 2. Criar a coleção — PUT (201)

>**Método:** PUT

>**Link:** http://localhost:8080/tvmaze/series

Se o banco ou a coleção já existirem, o retorno é **200** em vez de 201, o que também está correto.

### 3. Inserir uma série — POST (201)

>**Método:** POST

>**Link:** http://localhost:8080/tvmaze/series

Em **Body**, escolha **JSON** e cole o conteúdo de `testes/serie-exemplo.json`. O retorno deve ser **201**, e o id do novo documento aparece no cabeçalho **Location** da resposta (aba *Headers*), no final do link.

### 4. Listar as séries — GET (200)

>**Método:** GET

>**Link:** http://localhost:8080/tvmaze/series?pagesize=100

O retorno deve ser **200**, com a lista contendo o documento inserido. Cada documento vem com um `_id` no formato `{ "$oid": "..." }`.

### 5. Buscar uma série pelo id — GET (200 / 404)

>**Método:** GET

>**Link:** http://localhost:8080/tvmaze/series/{id}

Troque `{id}` pelo valor do `$oid`. Com um id que não existe, o retorno é **404**.

### Coleção pronta para importar

Todas as requisições do projeto (incluindo PUT, PATCH e DELETE de documentos, usados nas próximas etapas) estão em [`insomnia/colecao.json`](insomnia/colecao.json). No Insomnia: **Import** → selecione o arquivo. A autenticação Basic já vem configurada, e a requisição de POST guarda automaticamente o id criado para as requisições seguintes.
