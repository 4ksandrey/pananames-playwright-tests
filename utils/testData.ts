import type { ContactData } from '../pages/ContactsPage';

function uniqueToken(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 7);

  return `${timePart}${randomPart}`;
}

function lettersOnlyToken(token: string): string {
  return token.replace(/\d/g, (digit) => String.fromCharCode('a'.charCodeAt(0) + Number(digit)));
}

export function createContactData(): ContactData {
  const token = uniqueToken();
  const nameToken = lettersOnlyToken(token);

  return {
    name: `QaAuto${nameToken}`,
    firstName: 'QA',
    lastName: `Automation${nameToken}`,
    email: `qa-auto-${token}@example.com`,
    phonePrefix: '380',
    phoneNumber: `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`,
    comment: `Disposable automation contact ${token}`,
    supportRequests: true,
    promotionalEmails: false,
    productEmails: true,
    financialEmails: false,
  };
}

export function createDomainSld(): string {
  return `qaauto${uniqueToken()}`;
}
