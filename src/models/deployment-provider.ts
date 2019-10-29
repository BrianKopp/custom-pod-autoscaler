export interface DeploymentProvider {
    getReplicaCount: () => Promise<number>;
    setReplicaCount: (num: number) => Promise<boolean>;
}
