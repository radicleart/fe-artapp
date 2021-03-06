<template>
<div class="row">
  <side-menu class="col-3 mr-0 pr-0 pt-5"/>
  <div class="col-9 pt-5 admin-app" v-if="loaded">
    <title-bar class="container" v-on="$listeners"/>
    <div class="container" @click="$emit('toggle-off-navbar')">
      <h1>Deploy Contract</h1>
      <p class="mb-4">Contract id: {{projectId}} <router-link class="mr-3" :to="'/connect-app/' + projectId"><b-icon icon="pencil"/></router-link></p>
      <div class="row">
        <div class="col-4">
          <b-form>
            <div class="">
              <div class="">
                <div class="mb-2 d-flex justify-content-between">
                  <div>Contract Owner</div>
                  <div><a href="#" class="mr-1" @click.prevent="useMyAddress()">mine</a> <a class="text-info" href="#" @click.prevent="useMacsAddress()">macs</a></div>
                </div>
                <b-input v-model="params.contractOwner"></b-input>
                </div>
                <div class="mb-2">
                  <div class="mb-2">Mint Price (micro stacks)</div>
                  <b-input v-model="params.mintPrice"></b-input>
                </div>
                <div class="mb-2">
                  <div class="mb-2">Base URI</div>
                  <b-input v-model="params.callBack"></b-input>
                  <div class="mt-2 d-flex justify-content-end">
                    <a href="#" class="wallet-use text-white"><span class="text-light">
                      Provide your own callback or use our stateless open source search index
                      to store and retrieve asset meta data.
                      To add a record to our search index post an indexable model to:
                      http://api.risidio.local/index/addRecord see our <a href="https://github.com/radicleart/ms-search" target="_blank">github repo</a> for more details.
                      To retrieve a record (given the asset hash) get from
                      https://api.risidio.com/index/v1/asset/:asset-hash</span></a>
                  </div>
                </div>
                <p>Please check your contract carefully - click deploy when happy</p>
                <div class="my-3">
                  <b-button variant="info" class="btn-lg mr-3" style="text-transform: capitalize; font-size: 14px;" @click.prevent="deployContract()">Deploy Contract</b-button>
                  <b-button variant="danger" class="btn-lg" style="text-transform: capitalize; font-size: 14px;" to="/admin-app">Back</b-button>
                </div>
              </div>
          </b-form>
        </div>
          <div class="col-8">
            <h6>Template</h6>
            <standard-application-contract :contractSourceDisplay="contractSourceDisplay"/>
          </div>
        </div>
    </div>
  </div>
  <b-modal scrollable id="modal-1" title="Contract Deployed">
    <div class="row" v-if="deployedProject">
      <div class="col-12 my-1">
        <div class="mb-3">Deployed {{deployedProject.projectId}}</div>
        <div class="mb-3">Tx: {{deployedProject.txId}}</div>
      </div>
    </div>
  </b-modal>
  <b-modal id="modal-err" title="Contract Not Deployed">
    <div class="row">
      <div class="col-12 my-1">
        <div class="mb-3">Error: {{result}}</div>
      </div>
    </div>
  </b-modal>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import StandardApplicationContract from '@/components/admin/StandardApplicationContract'
import SideMenu from '@/components/admin/SideMenu'
import TitleBar from '@/components/admin/TitleBar'
import utils from '@/services/utils'

export default {
  name: 'CustomiseContract',
  components: {
    StandardApplicationContract,
    SideMenu,
    TitleBar
  },
  data () {
    return {
      feeAmount: 3000,
      projectId: null,
      project: null,
      showContract: false,
      loaded: false,
      nonce: 0,
      showStep2: false,
      tokenUrl: null,
      deployedProject: null,
      result: null,
      params: {
        mintPrice: '100000',
        contractName: null,
        contractOwner: 'stacks-address',
        callBack: 'https://loopbomb.risidio.com/nft/v1/assets/'
      },
      // contractSourceDisplay: null,
      contractSource: `
;; nongible
(define-data-var owner principal 'params.contractOwner)
(define-non-fungible-token nongible-tokens (buff 32)) ;; identifier is 256-bit hash of image
(define-data-var mint-price uint uparams.mintPrice)
(define-data-var base-token-uri (buff 100) params.callBack)
(define-map nongibles ((token-id (buff 32))) ((author principal) (date uint))) ;; extra info about token related to the nft-token

;; ownable methods
(define-read-only (get-owner)
    (var-get owner))

(define-read-only (is-owner)
    (ok (is-eq (var-get owner) tx-sender)))

(define-read-only (only-owner)
    (if (is-eq (var-get owner) tx-sender) (ok none) (err 1)))

(define-public (transfer-ownership (new-owner principal))
    (begin
        (asserts! (is-eq (var-get owner) tx-sender) (err 1))
        (var-set owner new-owner)
        (ok true)))

;; nongible methods
(define-public (update-base-token-uri (new-base-token-uri (buff 100)))
    (begin
        (asserts! (is-eq (var-get owner) tx-sender) (err 1))
        (var-set base-token-uri new-base-token-uri)
        (ok true)))

(define-public (update-mint-price (new-mint-price uint))
    (begin
        (asserts! (is-eq (var-get owner) tx-sender) (err 1))
        (var-set mint-price new-mint-price)
        (ok true)))

(define-read-only (get-base-token-uri)
    (var-get base-token-uri))

(define-read-only (get-mint-price)
    (var-get mint-price))

(define-read-only (get-token-uri (token-id (buff 32)))
    (concat (var-get base-token-uri) token-id))

(define-read-only (get-token-info (token-id (buff 32)))
    (map-get? nongibles ((token-id token-id))))

(define-public (mint-token (token-id (buff 32)))
    (begin
        (asserts! (>= (stx-get-balance tx-sender) (var-get mint-price)) (err 2))
        (as-contract
            (stx-transfer? (var-get mint-price) tx-sender (var-get owner))) ;; transfer stx if there is enough to pay for mint, otherwith throws an error
        (nft-mint? nongible-tokens token-id tx-sender) ;; fails if token has been minted before
        (map-insert nongibles ((token-id token-id)) ((author tx-sender) (date block-height)))
        (ok true)))
`
    }
  },
  watch: {
    /**
    params: {
      handler () {
        this.showStep2 = this.params.contractName && this.params.contractAddress
      },
      deep: true
    }
    **/
  },
  mounted () {
    this.projectId = this.$route.params.projectId
    this.$store.dispatch('projectStore/findProjectByProjectId', this.projectId).then((project) => {
      if (!project) {
        this.$router.push('/404')
        return
      }
      this.project = project
      this.loaded = true
    })
  },
  methods: {
    useMyAddress: function () {
      this.params.contractOwner = this.$store.getters[APP_CONSTANTS.KEY_PROFILE].stxAddress
    },
    useMacsAddress: function () {
      const mac = this.$store.getters[APP_CONSTANTS.KEY_MACS_WALLET]
      this.params.contractOwner = (mac && mac.keyInfo && mac.keyInfo.address) ? mac.keyInfo.address : ''
    },
    validate: function () {
      let result = true
      const mp = Number(this.params.mintPrice)
      if (!this.params.mintPrice || isNaN(mp) || mp < 10000 || mp > 100000000) {
        this.$notify({ type: 'error', title: 'Project Details', text: 'Please enter the mint price of your tokens (in micro stacks) between 0.001 and 100 stx' })
        result = false
      }
      if (!this.params.callBack || !this.params.callBack.startsWith('https://')) {
        this.$notify({ type: 'error', title: 'Project Details', text: 'Please enter a secure (https) callback url for your tokens - we append the asset hash to retrieve meta data.' })
        result = false
      }
      let tokenUrl
      try {
        tokenUrl = new URL(this.params.callBack)
        this.tokenUrl = tokenUrl
      } catch (e) {
        tokenUrl = ''
        result = false
      }
      return result
    },
    /**
    verifyContract: function () {
      if (!this.validate()) return
      let rep1 = '<span class="text-danger bg-white">' + this.params.contractOwner + '</span>'
      this.contractSourceDisplay = this.contractSource.replaceAll('params.contractOwner', rep1)
      rep1 = '<span class="text-danger bg-white">' + this.params.mintPrice + '</span>'
      this.contractSourceDisplay = this.contractSourceDisplay.replaceAll('params.mintPrice', rep1)
      rep1 = '<span class="text-danger bg-white">' + this.params.callBack + '</span>'
      this.contractSourceDisplay = this.contractSourceDisplay.replaceAll('params.callBack', rep1)
      // this.showContract = !this.showContract
    },
    **/
    deployContract: function () {
      if (!this.validate()) {
        return
      }
      // contractName = this.this.files[0].name.split(/\./)[1]
      const projectPlus = this.project
      let source = this.contractSource.replaceAll('params.contractOwner', this.params.contractOwner)
      source = source.replaceAll('params.mintPrice', this.params.mintPrice)
      source = source.replaceAll('params.callBack', utils.stringToHex(this.params.callBack))
      projectPlus.codeBody = source
      this.$store.dispatch('stacksStore/deployProjectContract', projectPlus).then((project) => {
        this.deployedProject = project
        this.$bvModal.show('modal-1')
      }).catch((error) => {
        this.result = error
        this.$bvModal.show('modal-err')
      })
    }
  },
  computed: {
    contractAddressUser () {
      return this.$store.getters[APP_CONSTANTS.KEY_PROFILE].stxAddress
    },
    contractSourceDisplay () {
      let rep1 = '<span class="text-danger bg-white">' + this.params.contractOwner + '</span>'
      let contractSourceDisplay = this.contractSource.replaceAll('params.contractOwner', rep1)
      rep1 = '<span class="text-danger bg-white">' + this.params.mintPrice + '</span>'
      contractSourceDisplay = contractSourceDisplay.replaceAll('params.mintPrice', rep1)
      rep1 = '<span class="text-danger bg-white">' + utils.stringToHex(this.params.callBack) + '</span>'
      contractSourceDisplay = contractSourceDisplay.replaceAll('params.callBack', rep1)
      return contractSourceDisplay
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
