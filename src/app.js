'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
module.exports = (db) => {
    db.getAsync = (query) => {
        return new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if(err) {                      
                    reject(err)        
                }
                else {
                    resolve(rows)
                }
            })
        })
    }

    db.postAsync = function(query, value) {       
        return new Promise((resolve, reject) => {
            db.run(query, value, function(err) {
                if(err) {            
                    reject(err)
                }
                else {
                    db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                        if(err) {                
                            reject(err)
                        }
                        else {
                            resolve(rows)
                        }
                    })
                }
            })
        })
    }
    
    app.use(bodyParser.urlencoded({
        extended: true
    }));   

	app.get('/health', (req, res) => res.send('Healthy'));

	app.post('/rides', jsonParser, async (req, res) => {
        try {               
            const startLatitude = Number(req.body.start_lat);
            const startLongitude = Number(req.body.start_long);
            const endLatitude = Number(req.body.end_lat);
            const endLongitude = Number(req.body.end_long);
            const riderName = req.body.rider_name;
            const driverName = req.body.driver_name;
            const driverVehicle = req.body.driver_vehicle;

            if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
                });
            }

            if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees'
                });
            }

            if (typeof riderName !== 'string' || riderName.length < 1) {            
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Rider name must be a non empty string',
                    riderNama : riderName
                });
            }

            if (typeof driverName !== 'string' || driverName.length < 1) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Driver name must be a non empty string'
                });
            }

            if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
                return res.send({
                    error_code: 'VALIDATION_ERROR',
                    message: 'Driver Vehicle must be a non empty string'
                });
            }

            let values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
            let query = 'INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)'                       
            let rows = await db.postAsync(query, values)            
            res.send(rows);
        }
        catch(err){
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            }); 
        }
	});

	app.get('/rides', async (req, res) => {
        try {            
            let rows = await db.getAsync('SELECT * FROM Rides')
            if(rows.length == 0){
                res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                })
            }
            else {
                const limitRows = 10
                const page = req.query.page || 1               
                res.send(rows.slice(page * limitRows - limitRows, page * limitRows));
            }
        }
        catch(err){
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            }); 
        }		
	});

	app.get('/rides/:id', async (req, res) => {
        try {
            let rideID = Number(req.params.id)
            let rows = await db.getAsync(`SELECT * FROM Rides WHERE rideID= '${rideID}'`)
            if(rows.length == 0){
                res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                })
            }
            else {
                const limitRows = 10
                const page = req.query.page || 1               
                res.send(rows.slice(page * limitRows - limitRows, page * limitRows));
            }
        }
        catch(err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            }); 
        }		
	});

	return app;
};
