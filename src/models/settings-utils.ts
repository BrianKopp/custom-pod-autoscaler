import debugLibrary from 'debug';
import { AutoscalingSettings } from './autoscaling-settings';
import { ScaleStrategy } from './scale-strategy.enum';
import { ThresholdMode } from './threshold-mode.enum';

const debug = debugLibrary('AUTOSCALER');

export const readSettings = (obj: any): AutoscalingSettings => {
    debug('reading settings');
    const deploymentToScale = obj.DEPLOYMENT_TO_SCALE;
    const deploymentNamespace = obj.DEPLOYMENT_NAMESPACE;
    const secondsBetweenPolls = Number(obj.SECONDS_BETWEEN_POLLS || 10);

    const thresholdInput = obj.THRESHOLD_MODE || 'TOTAL';
    let thresholdMode: ThresholdMode;
    if (thresholdInput === ThresholdMode.TOTAL) {
        thresholdMode = ThresholdMode.TOTAL;
    } else if (thresholdInput === ThresholdMode.PER_POD) {
        thresholdMode = ThresholdMode.PER_POD;
    } else {
        throw new Error('Unexpected input for THRESHOLD_MODE');
    }

    const maxPods = Number(obj.MAX_PODS || 20);

    const scaleUpThreshold = Number(obj.SCALE_UP_THRESHOLD || 100);
    const targetValuePerPod = Number(obj.TARGET_VALUE_PER_POD || 100);

    const scaleStrategyInput = obj.SCALE_STRATEGY || 'RATIO';
    let scaleStrategy: ScaleStrategy;
    if (scaleStrategyInput === ScaleStrategy.INCREMENT) {
        scaleStrategy = ScaleStrategy.INCREMENT;
    } else if (scaleStrategyInput === ScaleStrategy.RATIO) {
        scaleStrategy = ScaleStrategy.RATIO;
    } else {
        throw new Error('Unexpected input for SCALE_STRATEGY');
    }

    const scaleUpIncrement = Number(obj.SCALE_UP_INCREMENT || 2);
    const scaleDownIncrement = Number(obj.SCALE_DOWN_INCREMENT || 2);
    const maxIncrement = Number(obj.MAX_INCREMENT || 5);

    // allow falsy inputs, but default if not provided
    const minPodsEnv = obj.MIN_PODS;
    let minPods: number;
    if (typeof minPodsEnv !== 'undefined') {
        minPods = Number(minPodsEnv);
    } else {
        minPods = 2;
    }

    const scaleDownInput = obj.SCALE_DOWN_THRESHOLD;
    let scaleDownThreshold: number;
    if (typeof scaleDownInput !== 'undefined') {
        scaleDownThreshold = Number(scaleDownInput);
    } else {
        scaleDownThreshold = 10;
    }

    const scaleUpDelaySeconds = obj.SCALE_UP_DELAY;
    let scaleUpDelay: number;
    if (typeof scaleUpDelaySeconds !== 'undefined') {
        scaleUpDelay = Number(scaleUpDelaySeconds);
    } else {
        scaleUpDelay = 10;
    }

    const scaleDownDelaySeconds = obj.SCALE_DOWN_DELAY;
    let scaleDownDelay: number;
    if (typeof scaleDownDelaySeconds !== 'undefined') {
        scaleDownDelay = Number(scaleDownDelaySeconds);
    } else {
        scaleDownDelay = 120;
    }

    const settings: AutoscalingSettings = {
        deploymentToScale,
        deploymentNamespace,
        secondsBetweenPolls,
        thresholdMode,
        maxPods,
        scaleUpThreshold,
        targetValuePerPod,
        scaleStrategy,
        scaleUpIncrement,
        scaleDownIncrement,
        maxIncrement,
        minPods,
        scaleDownThreshold,
        scaleUpDelay,
        scaleDownDelay
    };

    debug('settings: ' + JSON.stringify(settings));
    return settings;
};

export const readSettingsFromEnvironment = (): AutoscalingSettings => {
    return readSettings(process.env);
};
