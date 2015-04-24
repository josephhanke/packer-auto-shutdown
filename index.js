var AWS = require("aws-sdk");
var moment = require("moment");

AWS.config.update({
    "region": "eu-west-1"
});

var ec2 = new AWS.EC2();
var serversToShut = [];

ec2.describeInstances({
    DryRun: false,
    Filters: [{
        Name: 'tag:baking',
        Values: [
            'packer'
        ]
    }, {
        Name: 'instance-state-name',
        Values: [
            'running'
        ]
    }]
}, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
        data.Reservations.forEach(function(item) {
            item.Instances.forEach(function(server) {
                var now = moment();
                var startTime = moment(server.LaunchTime);
                var timeElapsed = now.diff(startTime, 'minutes');
                if (timeElapsed > 60) {
                    serversToShut.push(server.InstanceId);
                }
            })
        })
    }

    if (serversToShut.length) {
        var params = {
            InstanceIds: serversToShut,
            DryRun: false
        };
        console.log('Shutting down ' + serversToShut.length + ' server');

        ec2.terminateInstances(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {
              console.log('Successfully shut down servers');
            }
        });
    }
    else {
      console.log('No servers overrunning')
    }
});