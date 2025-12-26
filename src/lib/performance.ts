import logger from './logger';

interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: Date;
    metadata?: Record<string, any>;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private readonly flushThreshold = 100;

    async trackOperation<T>(
        operation: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        const start = performance.now();
        try {
            const result = await fn();
            const duration = performance.now() - start;
            this.addMetric({
                operation,
                duration,
                timestamp: new Date(),
                metadata,
            });
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            this.addMetric({
                operation,
                duration,
                timestamp: new Date(),
                metadata: { ...metadata, error: true },
            });
            throw error;
        }
    }

    private addMetric(metric: PerformanceMetric) {
        this.metrics.push(metric);
        if (this.metrics.length >= this.flushThreshold) {
            this.flush();
        }
    }

    private flush() {
        if (this.metrics.length === 0) return;

        const metrics = [...this.metrics];
        this.metrics = [];

        // Calcular estatísticas
        const operationStats = metrics.reduce((acc, metric) => {
            const { operation, duration } = metric;
            if (!acc[operation]) {
                acc[operation] = {
                    count: 0,
                    totalDuration: 0,
                    maxDuration: 0,
                    minDuration: Infinity,
                };
            }

            acc[operation].count++;
            acc[operation].totalDuration += duration;
            acc[operation].maxDuration = Math.max(acc[operation].maxDuration, duration);
            acc[operation].minDuration = Math.min(acc[operation].minDuration, duration);

            return acc;
        }, {} as Record<string, any>);

        // Logar estatísticas
        Object.entries(operationStats).forEach(([operation, stats]: [string, any]) => {
            const avgDuration = stats.totalDuration / stats.count;
            logger.info('Performance metrics', {
                operation,
                avgDuration,
                maxDuration: stats.maxDuration,
                minDuration: stats.minDuration,
                count: stats.count,
            });
        });
    }
}

export const performanceMonitor = new PerformanceMonitor();