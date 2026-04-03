export function transformAuthUrls(
  routes: { [key: string]: any }
): Record<string, any[]> {
  const result: Record<string, any[]> = {};

  for (const key in routes) {
    if (Object.prototype.hasOwnProperty.call(routes, key)) {
      let routeConfig;
      const value = routes[key];

      if (typeof value === 'function') {
        // Only call functions that don't require parameters.
        if (value.length === 0) {
          routeConfig = value();
        } else {
          continue;
        }
      } else {
        routeConfig = value;
      }

      // Check that the routeConfig is an object with both "path" and "permissions"
      if (
        routeConfig &&
        typeof routeConfig === 'object' &&
        'path' in routeConfig &&
        'permissions' in routeConfig
      ) {
        result[routeConfig.path] = routeConfig.permissions;
      }
    }
  }

  return result;
}