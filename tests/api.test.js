'use strict';

const request = require('supertest');
const assert = require('assert')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => { 
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('GET /rides Error', () => {
        it('should return error message', () => {            
            return request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function(res) {
                    assert.strictEqual(res.body.error_code, 'RIDES_NOT_FOUND_ERROR')
                    assert.strictEqual(res.body.message, 'Could not find any rides')                    
                })
        })
    })

    var newRides = { 
        start_lat : 20, 
        start_long : 20, 
        end_lat : 20, 
        end_long : 20, 
        rider_name : 'Yotsuba', 
        driver_name : 'Adis', 
        driver_vehicle : 'BMW' 
    }

    describe('POST /rides Success', () => {
        it('should success create ride', () => {
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(res => {                    
                    assert.strictEqual(res.body.length, 1)
                })
        })
    })

    describe('POST /rides Error', () => {
        it('should return validation error Latitude', () => {
            newRides.start_lat = -100
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively')
                })

        })

        it('should return validation error Longtitude', () => {
            newRides.start_lat = 20
            newRides.start_long = -200
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively')
                })
        })


        it('should return validation error End Latitude', () => {
            newRides.start_long = 20
            newRides.end_lat = -100
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively')
                })
        })

        it('should return validation error End Longtitude', () => {        
            newRides.end_lat = 20
            newRides.end_long = -200
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively')
                })
        })

        it('should return validation error rider name empty', () => {        
            newRides.end_long = 20
            newRides.rider_name = ''
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Rider name must be a non empty string')
                })
        })

        it('should return validation error driver name empty', () => {        
            newRides.rider_name = 'Yotsuba'
            newRides.driver_name = ''
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Driver name must be a non empty string')
                })
        })

        it('should return validation error driver vehicle empty', () => {                    
            newRides.driver_name = 'Adis'
            newRides.driver_vehicle = ''
            return request(app)
                .post('/rides')
                .send(newRides)
                .expect('Content-Type', /json/)
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Driver Vehicle must be a non empty string')
                })
        })

    })

    describe('GET /rides/:id', () => {
        it('should retun one data', () => {
            newRides.driver_vehicle = 'BMW'
            return request(app)
                .get(`/rides/${1}`)
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function(res) {
                    assert.strictEqual(res.body.length, 1)
                })
        })
    })

    describe('GET /rides/:id Error', () => {
        it('should retun Error', () => {
            return request(app)
                .get(`/rides/${12321321}`)
                .expect('Content-Type', /json/)                
                .then(function(res) {
                    assert.strictEqual(res.body.message, 'Could not find any rides')
                })
        })
    })

    describe('GET /rides/ Success', () => {
        it('should retun data', () => {
            return request(app)
                .get('/rides')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function(res) {                    
                    assert.notEqual(res.body.length, 0)
                })
        })
    })

});