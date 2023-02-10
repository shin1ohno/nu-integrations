interface IntegrationInterface {
  up(): Promise<any>;

  down(): Promise<any>;
}

export { IntegrationInterface };
