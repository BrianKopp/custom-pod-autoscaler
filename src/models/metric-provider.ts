export interface MetricProvider {
    stop: () => void;
    getMetric: () => Promise<number>;
}
