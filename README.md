# Trabalho API TvMaze

As modificações no arquivo README do projeto serão feitas na main puramente por conveniência, sabemos que não seria o ideal.

## Papéis definidos

- Guilherme Vojciechovski: Dados (Modelagem, Banco, Docker)
- Luis Ronei: API (Requisições HTTP e Insomnia)
- Henrique Mengarda: Interface (Frontend e gráficos)

## Tema e API de origem

- **Tema:** Séries de TV
- **API de origem:** [TVmaze](https://www.tvmaze.com/api), gratuita e sem chave. É usada só para leitura (GET): `https://api.tvmaze.com/shows?page=0` na importação e `https://api.tvmaze.com/search/shows?q={nome}` na busca do site.
- **Banco NoSQL:** MongoDB exposto como API REST pelo RESTHeart, os dois em Docker. Banco `tvmaze`, coleção `series`.

## Como inicializar o MongoDB + RESTHeart via Docker-compose

### Como iniciar o Banco e o RESTHeart

Após clonar o repositório na sua máquina, e certificar que a engine do docker está ativa na máquina, abra um terminal no projeto e execute o seguinte comando:

>docker compose up

Alternativamente, para que o comando seja executado em segundo plano, permitindo que o terminal seja fechado sem encerrar o serviço, execute:

>docker compose up -d

**Com isso, os serviços estarão disponíveis:** frontend pelo Nginx em `http://localhost:8081/` e API RESTHeart em `http://localhost:8080/`.

O Nginx serve os arquivos do frontend e configura o tipo MIME dos módulos JavaScript, necessário para que o navegador carregue as funções da aplicação.

### Como conferir, parar e apagar o ambiente

```bash
docker compose ps                  # mongodb e restheart devem aparecer como "Up"
docker compose logs -f restheart   # ver erros da API
docker compose stop                # parar os containers (mantém os dados)
docker compose start               # ligar de novo
docker compose down                # parar e remover os containers
docker compose down -v             # parar e APAGAR todos os dados do banco
```

Depois de um `down -v` (ou na primeira vez), a coleção é inicializada pelo site. Para popular o catálogo novamente, rode `node js/importar.mjs`.

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

Para testar, envie essa requisição para criar o banco do projeto:

>**Método:** PUT

>**Link:** http://localhost:8080/tvmaze

E então, clique em **Send**, se tudo estiver correto, na direita haverá o retorno **201**, indicando que o recurso foi criado, portanto, também indicando que o banco está funcionando corretamente.


>Tenha em mente que esse teste não é necessário caso você pretenda executar o teste completo descrito nas próximas seções.
>
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
  "resumo": "Descrição indisponível.",
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
| `resumo` | texto | TVmaze (`summary`, sem tags HTML) |
| `favorito`, `minhaNota`, `comentario`, `criadoEm`, `atualizadoEm` | campos do grupo | não existem na API |

### Embutido x referenciado

- **Embutidos:** `generos` (lista) e `emissora` (objeto) ficam dentro do documento da série. São dados pequenos, sempre lidos junto com a série (nos cards, na busca, no filtro por gênero e no agrupamento por emissora) e quase nunca mudam. Embutindo, uma única requisição GET traz tudo, sem precisar juntar coleções.
- **Referenciado:** `tvmazeId` é uma referência à série na API de origem. Elenco e episódios não são copiados para o banco, porque podem ser muitos e crescer com o tempo. Quando precisamos deles (na página de detalhes), buscamos na TVmaze pelo `tvmazeId`.
- **Campos do grupo:** `favorito`, `minhaNota`, `comentario`, `criadoEm` e `atualizadoEm` não existem na TVmaze e são alterados pelo PUT e pelo PATCH.

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

## Importação dos dados (GET na TVmaze + POST no banco)

O script [`js/importar.mjs`](js/importar.mjs) faz a carga inicial da coleção:

1. **PUT** `/tvmaze` e **PUT** `/tvmaze/series`: garante que o banco e a coleção existem (201 na primeira vez, 200 se já existirem).
2. **GET** `https://api.tvmaze.com/shows?page=0`: busca as séries na API de origem (só leitura).
3. Converte cada série para o modelo de documento do grupo (seção "Modelo do documento JSON").
4. **POST** `/tvmaze/series` para cada série: grava o documento (201, com o id no cabeçalho `Location`).

O script não duplica séries: antes de gravar, ele lê do banco os `tvmazeId` que já existem e pula esses.

### Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 18 ou mais novo (confira com `node --version`).

Com o ambiente rodando (`docker compose up -d`), na raiz do projeto:

```bash
node js/importar.mjs        # importa 40 séries
node js/importar.mjs 60     # ou outra quantidade
```

No final ele mostra quantas séries foram inseridas e o total no banco. Para conferir no Insomnia: `GET /tvmaze/series/_size` (200).

## Endpoints

Base do banco: `http://localhost:8080/tvmaze/series`, com autenticação Basic `admin`/`secret`.

| Ação | Método e URL | Status esperado |
| --- | --- | --- |
| Buscar séries na origem | `GET https://api.tvmaze.com/shows?page=0` | 200 |
| Buscar série na origem por nome | `GET https://api.tvmaze.com/search/shows?q={nome}` | 200 |
| Criar o banco | `PUT /tvmaze` | 201 (200 se já existir) |
| Criar a coleção | `PUT /tvmaze/series` | 201 (200 se já existir) |
| Inserir série | `POST /tvmaze/series` | 201 (id no cabeçalho `Location`) |
| Listar séries | `GET /tvmaze/series?pagesize=100` | 200 |
| Contar séries | `GET /tvmaze/series/_size` | 200 |
| Buscar por nome no banco | `GET /tvmaze/series?filter={"nome":{"$regex":"dome","$options":"i"}}` | 200 |
| Filtrar por gênero | `GET /tvmaze/series?filter={"generos":"Drama"}` | 200 |
| Buscar por id | `GET /tvmaze/series/{id}` | 200 ou 404 |
| Substituir série | `PUT /tvmaze/series/{id}` | 200 |
| Alterar campos | `PATCH /tvmaze/series/{id}` | 200 |
| Excluir série | `DELETE /tvmaze/series/{id}` | 204 |

**Atenção:** o RESTHeart devolve no máximo 100 documentos por página por padrão. Para listar tudo, use `?pagesize=1000` (ou `&page=2`, `&page=3`...).

Todas essas requisições estão na coleção [`insomnia/colecao.json`](insomnia/colecao.json).

## Testes de todos os métodos HTTP

Sequência testada no Insomnia, com a coleção `insomnia/colecao.json`. Ela cria uma série de teste e a exclui no final, então o banco não fica com duplicatas:

| Ordem | Requisição | Resultado |
| --- | --- | --- |
| 1 | `POST /tvmaze/series` | 201 Created (id no `Location`) |
| 2 | `GET /tvmaze/series/{id}` | 200 OK |
| 3 | `PUT /tvmaze/series/{id}` | 200 OK |
| 4 | `GET /tvmaze/series/{id}` | 200 OK, com os campos alterados pelo PUT |
| 5 | `PATCH /tvmaze/series/{id}` | 200 OK |
| 6 | `DELETE /tvmaze/series/{id}` | 204 No Content |
| 7 | `GET /tvmaze/series/{id}` | 404 Not Found (série excluída) |

## Painel de indicadores

Na página inicial, use o botão **Painel de indicadores**, ao lado de **Séries guardadas**, para abrir o painel. Ele consulta os documentos salvos no RESTHeart e exibe o total de séries, média das notas TVmaze, quantidade de favoritas, gêneros diferentes, gráficos por gênero e status, ranking das séries mais bem avaliadas e tabela de séries agrupadas por gênero.

Na página de detalhes de uma série, a seção **Minha avaliação** permite escolher uma nota de 0 a 10, em passos de 0,5, e escrever um comentário de até 2.000 caracteres. **Salvar avaliação** grava os campos `minhaNota`, `comentario` e `atualizadoEm` no documento do MongoDB; os valores já existentes são carregados para edição.

Para apagar um título e todos os seus dados pessoais do MongoDB, use **Remover do banco** no card da página de séries guardadas ou nos detalhes da série e confirme a ação. Essa exclusão remove apenas o documento local; a série continua existindo na TVmaze.

### Conclusão tirada dos dados

_A preencher: prints do painel e um parágrafo com a conclusão que os dados permitem tirar._

## Uso de IA

Conforme pedido no enunciado, registramos onde ferramentas de IA foram usadas:

- **Claude (Anthropic):** rascunho do JSON de teste (`testes/serie-exemplo.json`), da coleção do Insomnia (`insomnia/colecao.json`), do script de importação (`js/importar.mjs`) e de partes deste README (modelo do documento, testes, importação e endpoints). Todo o código foi revisado e testado pelo grupo.
- _Demais integrantes: acrescentem aqui onde usaram IA._
