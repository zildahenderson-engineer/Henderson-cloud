# Disaster recovery

## Current status

A migration inicial do OaaS está aplicada no projeto Supabase indicado pelo usuário. O estado de backups automáticos, Point-in-Time Recovery, retenção, RPO/RTO e processo de restore **não foi verificado**; portanto, não presuma que backups estejam ativos nem que uma restauração tenha sido testada. O projeto Vercel `oaas-platform` existe, mas nenhum deployment foi concluído.

## Production checklist

- Verificar a configuração de backup do projeto e definir RPO/RTO, retenção e região compatíveis com requisitos legais/operacionais.
- Manter exportação lógica criptografada e cópia segregada de migrations/configuração sem credenciais.
- Proteger backups com least privilege, MFA, criptografia em trânsito/repouso e controle de acesso.
- Testar restore em projeto isolado em periodicidade definida; medir tempo, validar contagens/constraints/RLS e registrar evidência.
- Documentar procedimento de rotação de segredos, revogação de sessões, comunicação de incidentes e rollback Vercel.
- Não executar restore destrutivo em produção sem aprovação e plano de preservação de dados atuais.
