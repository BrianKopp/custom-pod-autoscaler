import debugLibrary from 'debug';
import { AutoscalingSettings, DeploymentProvider, MetricProvider, ScaleStrategy, ThresholdMode } from './models';

const debug = debugLibrary('AUTOSCALER');

export class CustomPodAutoscaler {
    private continue: boolean = true;
    private currentReplicas: number;
    private desiredReplicas: number;
    private currentMetricValue: number;
    private lastScale: number;
    constructor(
        private metricProvider: MetricProvider,
        private deploymentProvider: DeploymentProvider,
        private settings: AutoscalingSettings
    ) { }

    public async run(): Promise<boolean> {
        while (this.continue) {
            try {
                debug('inspecting system');
                await this.inspect();
                debug('dispatch based on system state');
                await this.dispatch();
                debug('waiting for next control loop');
                await this.waitForNextPoll(this.settings.secondsBetweenPolls);
            } catch (e) {
                console.error('error running loop, error: ', e);
            }
        }
        return true;
    }

    public stop() {
        this.continue = false;
    }

    public async getReplicaCount(): Promise<number> {
        return await this.deploymentProvider.getReplicaCount();
    }

    public async setReplicaCount(replicas: number): Promise<boolean> {
        return await this.deploymentProvider.setReplicaCount(replicas);
    }

    private async inspect(): Promise<boolean> {
        this.currentReplicas = await this.getReplicaCount();
        debug(`Current replica count: ${this.currentReplicas}`);

        this.currentMetricValue = await this.metricProvider.getMetric();
        debug(`Current metric value: ${this.currentMetricValue}`);

        this.desiredReplicas = await this.calculateDesiredReplicas(this.currentMetricValue);
        debug(`Desired replicas count: ${this.desiredReplicas}`);

        return true;
    }

    private async dispatch(): Promise<boolean> {
        debug('running dispatch algorithm...');
        if (this.desiredReplicas === this.currentReplicas) {
            debug(`desired count and current count are equal at ${this.desiredReplicas}, exiting loop`);
            return true;
        }
        const now = Date.now();
        const scaleDirection = this.desiredReplicas > this.currentReplicas ? 1 : -1;
        if (this.lastScale) {
            debug('checking scale cooldown time');
            let scaleWaitTime = 0;
            if (scaleDirection > 0) {
                scaleWaitTime = this.lastScale + this.settings.scaleUpDelay;
            } else {
                scaleWaitTime = this.lastScale + this.settings.scaleDownDelay;
            }
            debug(`scaling not allowed to happen until ${scaleWaitTime} due to cooldown`);
            if (now < scaleWaitTime) {
                debug(`cannot scale due to cooldown, ${Math.round(10 * (scaleWaitTime - now)) / 10} seconds remaining`);
                return true;
            }
        }

        return this.setReplicaCount(this.desiredReplicas);
    }

    private calculateDesiredReplicas(
        metricValue: number
    ) {
        if (this.settings.thresholdMode === ThresholdMode.PER_POD) {
            const metricPerPod = metricValue / this.currentReplicas;
            const ratio = metricPerPod / this.settings.targetValuePerPod;

            // round up
            const calculatedDesired = Math.ceil(ratio * this.currentReplicas);
            let difference = calculatedDesired - this.currentReplicas;

            if (this.settings.scaleStrategy === ScaleStrategy.RATIO) {
                const maxIncrement = this.settings.maxIncrement;
                if (Math.abs(difference) > maxIncrement) {
                    difference = difference > 0 ? maxIncrement : -1 * maxIncrement;
                }
            } else {
                // increment
                if (difference > 0) {
                    difference = Math.min(this.settings.scaleUpIncrement, difference);
                } else if (difference < 0) {
                    difference = -1 * Math.min(difference * -1, this.settings.scaleDownIncrement);
                }
            }
            return this.currentReplicas + difference;
        } else {
            if (metricValue >= this.settings.scaleUpThreshold) {
                return this.currentReplicas + this.settings.scaleUpIncrement;
            } else if (metricValue <= this.settings.scaleDownThreshold) {
                return this.currentReplicas - this.settings.scaleDownIncrement;
            }
        }
    }
    private async waitForNextPoll(seconds: number): Promise<boolean> {
        debug('waiting for next poll in ' + seconds + ' seconds');
        return new Promise<boolean>((resolve, _) => {
            setTimeout(() => {
                debug('finished waiting for next poll');
                resolve();
            }, seconds * 1000);
        });
    }
}
