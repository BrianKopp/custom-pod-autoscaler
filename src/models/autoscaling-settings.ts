import { ScaleStrategy } from './scale-strategy.enum';
import { ThresholdMode } from './threshold-mode.enum';

export interface AutoscalingSettings {
    thresholdMode: ThresholdMode;
    scaleStrategy: ScaleStrategy;

    targetValuePerPod: number;
    maxIncrement: number;
    scaleUpIncrement: number;
    scaleDownIncrement: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    secondsBetweenPolls: number;
    scaleUpDelay: number;
    scaleDownDelay: number;
    deploymentToScale: string;
    deploymentNamespace: string;
    maxPods: number;
    minPods: number;
}
