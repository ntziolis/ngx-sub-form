export class UnreachableCase extends Error {
  constructor(private payload: any) {
    super();
    
  }
}
