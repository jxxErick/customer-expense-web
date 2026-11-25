import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <h1>Um painel para as duas APIs</h1>
      <p class="muted">
        Cadastro de clientes com endereço pelo CEP e divisão de despesas em grupo, cada um no seu back-end Spring Boot.
      </p>
    </section>

    <div class="grid two">
      <a class="card link-card" routerLink="/customers">
        <h2>Clientes</h2>
        <p class="muted">Cadastro com CEP, histórico de alterações, detecção de duplicados e mesclagem.</p>
        <span class="pill">customer-api · :8080</span>
      </a>
      <a class="card link-card" routerLink="/groups">
        <h2>Grupos de despesas</h2>
        <p class="muted">Despesas divididas, saldos, dívidas simplificadas, "quitar tudo", relatório e atividades.</p>
        <span class="pill">expense-split-api · :8081</span>
      </a>
    </div>
  `,
})
export class HomeComponent {}
