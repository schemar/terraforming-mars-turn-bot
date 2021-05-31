let servers: string[] = [];

export const setServers = (setServers: string[]): void => {
  servers = setServers;
};

export const getServers = (): string[] => {
  return servers;
};
