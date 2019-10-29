export interface MetricProvider {
    stop: () => void;
    getMetric: () => number;
}
