import type { User } from './types'

export const users: User[] = [
  { name: 'Mariana Costa', initials: 'MC', email: 'mariana@tratto.com.br', role: 'Jurídico', active: true, lastAccess: 'hoje' },
  { name: 'Rodrigo Santos', initials: 'RS', email: 'rodrigo@imobiliaria.com', role: 'Corretor', active: true, lastAccess: 'hoje' },
  { name: 'Camila Andrade', initials: 'CA', email: 'camila@imobiliaria.com', role: 'Corretor', active: true, lastAccess: 'ontem' },
  { name: 'Ricardo Souza', initials: 'RS', email: 'ricardo@juridico.com', role: 'Jurídico', active: true, lastAccess: '2 nov' },
  { name: 'Thiago Braga', initials: 'TB', email: 'thiago@imobiliaria.com', role: 'Corretor', active: false, lastAccess: '15 out' },
  { name: 'Admin Tratto', initials: 'AT', email: 'admin@tratto.com.br', role: 'Admin', active: true, lastAccess: 'hoje' },
]

/** Usuário logado — alimenta a saudação do dashboard e o rodapé da sidebar. */
export const currentUser = users[0]
