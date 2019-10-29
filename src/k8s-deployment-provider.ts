import k8s from '@kubernetes/client-node';
import { AutoscalingSettings, DeploymentProvider } from './models';

export class KubernetesDeploymentProvider implements DeploymentProvider {
    private api: k8s.ExtensionsV1beta1Api;
    constructor(private settings: AutoscalingSettings, deploymentApi?: k8s.ExtensionsV1beta1Api) {
        if (deploymentApi) {
            this.api = deploymentApi;
        } else {
            const kc = new k8s.KubeConfig();
            kc.loadFromCluster();
            this.api = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
        }
    }

    public async getReplicaCount(): Promise<number> {
        const { body } = await this.api.readNamespacedDeployment(
            this.settings.deploymentToScale,
            this.settings.deploymentNamespace
        );
        console.log(body);
        return body.spec.replicas;
    }

    public async setReplicaCount(num: number): Promise<boolean> {
        await this.api.patchNamespacedDeployment(
            this.settings.deploymentToScale,
            this.settings.deploymentNamespace,
            { spec: { replicas: num } }
        );
        return true;
    }
}
