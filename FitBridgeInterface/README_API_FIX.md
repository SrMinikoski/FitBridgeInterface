README - Correções CORS e Serialização (API + Frontend)

Objetivo

Este documento reúne as explicações e os trechos de código necessários para resolver o problema observado durante a integração do frontend Angular com a API Spring Boot. O problema principal era uma requisição que travava (infinite loading) porque a API entrava em um loop de serialização (referência circular) e, inicialmente, o frontend fazia chamadas diretas à `http://localhost:8080` (causando CORS). Abaixo seguem as instruções para aplicar as correções na API e no frontend.

1) Problema identificado

- A API retornava exceções da Jackson ao serializar coleções que referenciam de volta a entidades-pai, por exemplo: `Aluno -> Favorito -> Aluno -> ...`. Isso causa resposta pendente/loop e o frontend fica carregando indefinidamente.
- O frontend inicialmente chamou `http://localhost:8080/api/...` diretamente, fazendo o navegador bloquear por CORS durante desenvolvimento (origin `http://localhost:4200`).

2) Correção na API (Spring Boot)

Arquivo: `src/main/java/com/fitbridge/model/Aluno.java`

Passos:
- Adicionar o import de `@JsonIgnore`.
- Anotar o campo `favoritos` com `@JsonIgnore` para quebrar a recursão na serialização.

Substitua (ou edite) o trecho relevante por este código completo:

--- INÍCIO: Aluno.java (trecho completo recomendado) ---
package com.fitbridge.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "aluno")
public class Aluno {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String sexo;
    private Integer idade;
    private Float altura;
    private Float peso;
    private String objetivo;
    private String email;
    private String senha;

    @OneToMany(mappedBy = "aluno", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Favorito> favoritos = new ArrayList<>();

    public Aluno() {}

    public Aluno(String nome, String sexo, Integer idade, Float altura, Float peso, String objetivo, String email, String senha) {
        this.nome = nome;
        this.sexo = sexo;
        this.idade = idade;
        this.altura = altura;
        this.peso = peso;
        this.objetivo = objetivo;
        this.email = email;
        this.senha = senha;
    }

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getSexo() { return sexo; }
    public void setSexo(String sexo) { this.sexo = sexo; }
    public Integer getIdade() { return idade; }
    public void setIdade(Integer idade) { this.idade = idade; }
    public Float getAltura() { return altura; }
    public void setAltura(Float altura) { this.altura = altura; }
    public Float getPeso() { return peso; }
    public void setPeso(Float peso) { this.peso = peso; }
    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public List<Favorito> getFavoritos() { return favoritos; }
    public void setFavoritos(List<Favorito> favoritos) { this.favoritos = favoritos; }
}
--- FIM: Aluno.java ---

Observação: o `Instrutor.java` já possui `@JsonIgnore` no campo `treinos` — siga o mesmo padrão.

3) Alternativa segura: DTOs

Se preferir evitar modificar entidades diretamente, crie DTOs (por exemplo `AlunoDTO`) que não contenham a relação `favoritos` ou que a representem de forma plana. Use mapeamento em controllers/serviços para retornar DTOs.

4) Mudanças no frontend (Angular)

Arquivos e alterações que apliquei no projeto de frontend (para referência) — copie e aplique no seu projeto caso necessário.

A) `AuthService` — usar URL relativa `/api` e adicionar timeout para evitar bloqueios

Arquivo: `src/app/services/auth.service.ts`

Substitua o conteúdo do serviço (ou atualize) pelo código abaixo (já presente na cópia do projeto):

--- INÍCIO: auth.service.ts ---
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, catchError, timeout } from 'rxjs/operators';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: 'ALUNO' | 'INSTRUTOR';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  private usuarioLogadoKey = 'usuarioLogado';

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<Usuario | null> {
    return forkJoin({
      alunos: this.http.get<any[]>(`${this.apiUrl}/alunos`).pipe(
        timeout(10000),
        catchError(() => of([]))
      ),
      instrutores: this.http.get<any[]>(`${this.apiUrl}/instrutores`).pipe(
        timeout(10000),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ alunos, instrutores }) => {
        const aluno = alunos.find((a: any) => a.email === email && a.senha === senha);
        if (aluno) {
          return { id: aluno.id, nome: aluno.nome, email: aluno.email, tipo: 'ALUNO' as const };
        }

        const instrutor = instrutores.find((i: any) => i.email === email && i.senha === senha);
        if (instrutor) {
          return { id: instrutor.id, nome: instrutor.nome, email: instrutor.email, tipo: 'INSTRUTOR' as const };
        }

        return null;
      }),
      tap((usuario) => {
        if (usuario) {
          localStorage.setItem(this.usuarioLogadoKey, JSON.stringify(usuario));
        }
      }),
      catchError(() => of(null))
    );
  }

  logout(): void {
    localStorage.removeItem(this.usuarioLogadoKey);
  }

  getUsuarioLogado(): Usuario | null {
    const usuario = localStorage.getItem(this.usuarioLogadoKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  estaLogado(): boolean {
    return !!this.getUsuarioLogado();
  }
}
--- FIM: auth.service.ts ---

B) `proxy.conf.json` — evitar CORS durante desenvolvimento

Crie o arquivo na raiz do frontend (já adicionado na cópia):

--- INÍCIO: proxy.conf.json ---
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": "/api"
    }
  }
}
--- FIM: proxy.conf.json ---

C) `angular.json` — usar proxy em modo development

Adicione a propriedade `proxyConfig` dentro de `serve -> configurations -> development`:

--- INÍCIO: trecho angular.json ---
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": {
    "production": {
      "buildTarget": "FitBridgeInterface:build:production"
    },
    "development": {
      "buildTarget": "FitBridgeInterface:build:development",
      "proxyConfig": "proxy.conf.json"
    }
  },
  "defaultConfiguration": "development"
},
--- FIM: trecho angular.json ---

D) Reinicie o servidor de frontend com `ng serve` (em modo development ele usa o proxy automaticamente).

5) Reiniciar a API

Após aplicar `@JsonIgnore` em `Aluno.favoritos`, recompile e reinicie a API. Exemplo (no projeto da API):

```bash
# na pasta da API
mvn spring-boot:run
# ou, se preferir
mvn clean package
java -jar target/fitbridge-0.0.1-SNAPSHOT.jar
```

6) Testes / Verificações

- Acesse a aplicação frontend em `http://localhost:4200`.
- Faça login com as credenciais de teste (exemplo do `API_TEST_REQUESTS.md`):
  - Aluno de teste: `joao.silva@email.com` / `123456`
  - Instrutor de teste: `maria.santos@email.com` / `123456`
- Verifique que a home exibe `Bem vindo [Nome do Usuário]` e que o `navigation` mostra o nome e o botão de logout.

7) Observações e boas práticas

- Em produção, evite validar senha no frontend; implemente autenticação no backend (endpoint `POST /api/login`) e use tokens (JWT) ou sessões seguras.
- DTOs ajudam a evitar problemas de serialização e expor somente os campos necessários.
- Caso existam múltiplas relações bidirecionais, avalie usar `@JsonIgnore`, `@JsonManagedReference`/`@JsonBackReference` ou MapStruct para mapeamento controlado.

---

Se quiser, posso:
- Gerar um patch pronto para aplicar na API (edição automática de `Aluno.java`) — mas por sua regra, não altero diretamente a cópia da API sem seu OK.
- Gerar um endpoint `POST /api/login` de exemplo na API (código do controller) para você aplicar no repositório original.


