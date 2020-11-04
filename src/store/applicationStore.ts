import projectService from '@/services/projectService.js'
import utils from '@/services/utils'
import axios from 'axios'
import store from '.'
import { intCV, serializeCV } from '@stacks/transactions'

const SEARCH_API_PATH = process.env.VUE_APP_API_SEARCH
const readProjectFromGaia = function (resolve, reject, projectLookups, commit) {
  try {
    projectLookups.forEach((projectLookup) => {
      projectService.fetchUserProjects(projectLookup.owner).then((connectedProjects) => {
        commit('setConnectedProjects', { owner: projectLookup.owner, projects: connectedProjects })
      })
    })
    resolve()
  } catch {
    reject(new Error('Unable to fetch project from users gaia storage.' + JSON.stringify(projectLookups)))
  }
}

const applicationStore = {
  namespaced: true,
  state: {
    rootFile: null,
    appmap: {
      apps: []
    },
    appCounter: -1,
    connectedProjects: null,
    appmapContractId: 'ST1ESYCGJB5Z5NBHS39XPC70PGC14WAQK5XXNQYDW.appmap'
  },
  getters: {
    getAppmapTxId: (state: any) => {
      return state.appmap.txId
    },
    getAppmap: state => {
      return state.appmap
    },
    getAppmapContractId: (state: any) => {
      return state.appmapContractId
    },
    getAppmapCounter: (state: any) => {
      return state.appCounter
    },
    getAppmapProject: (state: any) => projectId => {
      const index = state.appmap.apps.findIndex((o) => o.projectId === projectId)
      if (index > -1) {
        return state.appmap.apps[index]
      }
    }
  },
  mutations: {
    rootFile (state: any, rootFile: any) {
      state.rootFile = rootFile
    },
    setAppCounter (state, appCounter) {
      state.appCounter = appCounter
    },
    setAppmap (state, appmap) {
      state.appmap = appmap
    },
    addAppToAppmap (state, application) {
      const index = state.appmap.apps.findIndex((o) => o.appCounter === application.appCounter)
      if (index < 0) {
        state.appmap.apps.splice(application.appCounter, 0, application)
      } else {
        state.appmap.apps.splice(index, 1, application)
      }
    }
  },
  actions: {
    lookupApplications ({ state, commit, dispatch }: any) {
      return new Promise((resolve, reject) => {
        store.dispatch('stacksStore/callContractReadOnly', { contractId: state.appmapContractId, functionName: 'get-app-counter' }).then((data) => {
          const appCounter = data.value.value
          commit('setAppCounter', appCounter)
          for (let i = 0; i < appCounter; i++) {
            dispatch('lookupApplicationByIndex', i)
          }
        }).catch((e) => {
          reject(e)
        })
      })
    },
    lookupApplicationByIndex: function ({ state, commit, dispatch }: any, appCounter: number) {
      return new Promise(function (resolve, reject) {
        const index = state.appmap.apps.findIndex((o) => o.appCounter === appCounter)
        if (index > -1) {
          resolve(state.appmap.apps[index])
          return
        }
        const functionArgs = [`0x${serializeCV(intCV(appCounter)).toString('hex')}`]
        const config = {
          contractId: state.appmapContractId,
          functionName: 'get-app',
          functionArgs: functionArgs
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((response) => {
          const application: any = utils.toObjectApplication(response)
          application.appCounter = appCounter
          dispatch('fetchApplicationBaseTokenAddress', application)
          commit('addAppToAppmap', application)
          resolve(application)
        }).catch((e) => {
          reject(e)
        })
      })
    },
    fetchApplicationBaseTokenAddress: function ({ commit }: any, application: any) {
      return new Promise(function (resolve, reject) {
        const config = {
          contractId: application.contractId,
          functionName: 'get-base-token-uri',
          functionArgs: []
        }
        store.dispatch('stacksStore/callContractReadOnly', config).then((response) => {
          const baseTokenUri = utils.toObjectString(response, 'base-token-uri')
          application.baseTokenUri = baseTokenUri
          commit('addAppToAppmap', application)
          resolve(application)
        }).catch((e) => {
          reject(e)
        })
      })
    },
    findApplicationsByOwner: function ({ commit }: any, owner: string) {
      return new Promise(function (resolve, reject) {
        if (!owner) {
          reject(new Error('No owner'))
          return
        }
        const url = SEARCH_API_PATH + '/projectsByOwner/' + owner
        axios.get(url).then((response) => {
          readProjectFromGaia(resolve, reject, response.data, commit)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findApplicationByProjectId ({ commit }: any, projectId: string) {
      return new Promise((resolve, reject) => {
        if (!projectId) {
          reject(new Error('No domain'))
          return
        }
        const url = SEARCH_API_PATH + '/projectsByProjectId/' + projectId
        axios.get(url).then((response) => {
          if (response.data) {
            const projectLookups = [response.data]
            readProjectFromGaia(resolve, reject, projectLookups, commit)
          }
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    }
  }
}
export default applicationStore
