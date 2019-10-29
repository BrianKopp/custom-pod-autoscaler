const cpaLib = require('custom-pod-autoscaler');
const mockEnvSettings = {
    DEPLOYMENT_TO_SCALE: 'busybox',
    DEPLOYMENT_NAMESPACE: 'default',
    MIN_PODS: 0,
    // use defaults for rest
};

let curlMetricValue = 0;

class CurlMetricsExporter {
    stop() {
        console.log('received stop command, dont do anything because this is just an example');
    }
    getMetric() {
        return new Promise((resolve, reject) => {
            resolve(curlMetricValue);
        });
    }
}

const cpa = new cpaLib.CustomPodAutoscaler(
    new CurlMetricsExporter(),
    new cpaLib.KubernetesDeploymentProvider(),
    mockEnvSettings
);

cpa.run().then(() => {
    console.log('finished running cluster pod autoscaler');
}).catch((err) => {
    console.error('error running cluster pod autoscaler', err);
});

const app = require('express')();
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get('/replicas', async (req, res) => {
    const count = await cpa.getReplicaCount();
    res.json({ replicas: count });
});

app.get('/metric', (req, res) => {
    res.json({ value: curlMetricValue });
});

app.put('/metric', (req, res) => {
    const count = Number(req.body.count);
    console.log('setting metric to ' + count);
    curlMetricValue = count;
    res.json({ message: 'OK' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
    console.log('listening on port ' + port);
});

const shutdown = (signal) => {
    console.log('received signal ' + signal + '. shutting down');
    server.close((err) => {
        if (err) {
            console.error('error while closing server', err);
            process.exit(1);
        } else {
            console.log('successfully closed server');
            process.exit(0);
        }
    });
}
