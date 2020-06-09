/**
 * Identifies the current application
 *
 * Many apps will have a configuration object that already conforms to this.
 */
export interface AppIdentifier {
  /**
   * Name of the application
   *
   * This will typically be the name of the GitHub repository
   */
  name: string;

  /**
   * Version of the application
   *
   * This will typically be a CI build number.
   */
  version?: string;
}
