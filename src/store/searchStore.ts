
import searchIndexService from '@/services/searchIndexService'
import store from '.'

const searchStore = {
  namespaced: true,
  state: {
    searchResults: null,
    projects: null
  },
  getters: {
    getSearchResults: (state: any) => {
      return state.searchResults
    },
    getAsset: (state: any) => (assetHash: string) => {
      if (assetHash && state.searchResults && state.searchResults.length > 0) {
        const asset = state.searchResults.find(o => o.assetHash === assetHash)
        return asset
      }
      return null
    },
    getProjects: (state: any) => {
      return state.projects
    }
  },
  mutations: {
    setSearchResults: (state: any, searchResults: any) => {
      state.searchResults = searchResults
    },
    addSearchResult: (state: any, result: any) => {
      if (!state.searchResults) {
        state.searchResults = []
      }
      if (result) state.searchResults.push(result)
    },
    setProjects: (state: any, projects: any) => {
      state.projects = projects
    }
  },
  actions: {
    indexUsers ({ commit }: any, users: string) {
      return new Promise((resolve, reject) => {
        searchIndexService.indexUsers(users).then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    clearAssets ({ commit }: any) {
      return new Promise((resolve, reject) => {
        searchIndexService.clearDappsIndex().then((resultSet) => {
          commit('setArtworks', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    clearUsers ({ commit }: any) {
      return new Promise((resolve, reject) => {
        searchIndexService.clearNamesIndex().then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findAssetByHash ({ commit }: any, assetHash: string) {
      return new Promise((resolve, reject) => {
        searchIndexService.findAssetByHash(assetHash).then((response: any) => {
          resolve(response.data)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findAssets ({ commit }: any) {
      return new Promise((resolve, reject) => {
        searchIndexService.findAssets().then((resultSet) => {
          commit('setArtworks', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findUsers ({ commit }: any) {
      return new Promise((resolve, reject) => {
        searchIndexService.fetchAllNamesIndex().then((resultSet) => {
          commit('setUsers', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    },
    findBySearchTerm ({ commit }: any, query: string) {
      return new Promise((resolve, reject) => {
        if (query && query.length > 0) {
          query += '*'
          searchIndexService.findByTitleOrDescriptionOrCategoryOrKeyword(query).then((resultSet) => {
            commit('setSearchResults', resultSet)
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        } else {
          query += '*'
          searchIndexService.findAssets().then((resultSet) => {
            commit('setSearchResults', resultSet)
            resolve(resultSet)
          }).catch((error) => {
            reject(new Error('Unable index record: ' + error))
          })
        }
      })
    },
    findByProjectId ({ commit }: any, projectId: string) {
      return new Promise((resolve, reject) => {
        searchIndexService.findByProjectId(projectId).then((resultSet) => {
          commit('setSearchResults', resultSet)
          resolve(resultSet)
        }).catch((error) => {
          reject(new Error('Unable index record: ' + error))
        })
      })
    }
  }
}
export default searchStore
