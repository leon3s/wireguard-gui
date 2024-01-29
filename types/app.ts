export type AppState = {
  current?: string | null;
  conn_st?: 'Connected' | 'Disconnected';
  pub_ip?: string | null;
};
