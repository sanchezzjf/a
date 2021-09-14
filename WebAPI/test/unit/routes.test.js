import { describe, test, expect, jest } from '@jest/globals';

import Routes from '../../src/routes';

describe('#Routes test suit', () => {
    const defaultParams = {
        request: {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            method: '',
            body: {}

        },
        response: {
            setHeader: jest.fn(),
            writeHead: jest.fn(),
            end: jest.fn()
        },
        values: () => Object.values(defaultParams)
    }
    describe('#setSocketInstance', () => {
        test('setSocket should store io instance', () => {
            const routes = new Routes()

            const ioObj = {
                to: (id) => ioObj,
                emit: (event, message) => {}
            }

            routes.setSocketInstance(ioObj)
            expect(routes.io).toStrictEqual(ioObj)
        })
    })
    describe('#handler', () => {

        test('given an inexistent route it should choose default route', async ()=> {
            const routes = new Routes()
            const params = {
                ...defaultParams //clona o defaultParams
            }

            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.end).toHaveBeenCalledWith('Salve salve familia')
        })
        test('it should set any request with CORS enabled', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            params.request.method = 'inexistent'
            await routes.handler(...params.values())
            expect(params.response.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
        })
        test('given method OPTIONS it should choose options route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            params.request.method = 'OPTIONS'
            await routes.handler(...params.values())
            expect(params.response.writeHead).toHaveBeenCalledWith(204)
            expect(params.response.end).toHaveBeenCalledWith('Salve salve familia')
        })
        test('given method POST it should choose post route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            params.request.method = 'POST'
            jest.spyOn(routes, routes.post.name).mockResolvedValue()
            await routes.handler(...params.values())
            expect(routes.post).toHaveBeenCalled()
        })
        test('give method GET it should choose get route', async () => {
            const routes = new Routes()
            const params = {
                ...defaultParams
            }
            params.request.method = 'GET'
            await routes.handler(...params.values())
            jest.spyOn(routes, routes.get.name).mockResolvedValue()
            await routes.handler(...params.values())
            expect(routes.get).toHaveBeenCalled()
        })
    })

    describe('#get', () => {
        test('given method GET it should list all files downloaded', async () => {
            const route = new Routes()
            const params = {
                ...defaultParams
            }
            
            const filesStatusesMock = [
                {
                    size: '2.91 MB', //in bytes
                    lastModified: '2021-09-13T01:38:49.692Z',
                    owner: 'Joao',
                    file: 'forest.jpg'
                }
            ]
            jest.spyOn(route.fileHelper, route.fileHelper.getFileStatus.name)
                .mockResolvedValue(filesStatusesMock)

            params.request.method = 'GET'
            await route.handler(...params.values())
            
            expect(params.response.writeHead).toHaveBeenCalledWith(200)
            expect(params.response.end).toBeCalledWith(JSON.stringify(filesStatusesMock))
        })
    })
})