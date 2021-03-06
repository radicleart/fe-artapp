<template>
<div v-if="loaded">
  <div class="row">
    <side-menu class="col-3 mr-0 pr-0 pt-5"/>
    <div class="col-9 py-5 admin-app">
      <title-bar class="container" v-on="$listeners"/>
      <div class="container" @click="$emit('toggle-off-navbar')">
        <h1>Connect Your Own Application</h1>
        <p>About your application</p>
        <div class="row">
          <div class="col-md-4 col-sm-12">
            <div class="mb-2">
              <div :style="bannerImage" v-if="files && files.length === 0" class="d-flex align-items-center flex-column m-2 p-2 bg-white border" style="width: 250px; height: 250px;">
                <div class="mt-5 my-auto text-center">
                  <app-logo-upload class="" :dims="dims" :contentModel="contentModel1" :showFiles="true" :mediaFiles="mediaFiles1" :limit="1" :sizeLimit="2000000" :mediaTypes="'image'" @updateMedia="setByEventLogo1($event)"/>
                </div>
              </div>
              <div v-else :style="bannerImage" class="d-flex align-items-end flex-column" style="width: 250px; height: 250px;">
                <span class="bg-dark p-1 mt-auto" style="position: relative; bottom: 0;">
                  <a class="text-white" href="#" @click.prevent="files = []" v-if="files && files.length > 0">change</a>
                </span>
              </div>
            </div>
          </div>
          <div class="col-md-8 col-sm-12">
            <b-form>
              <div class="mb-4">
                <div class="">Name</div>
                <b-input
                  id="title"
                  v-model="project.title"
                  ></b-input>
              </div>
              <div class="mb-4">
                <div class="">Description</div>
                <b-input
                  ref="description"
                  v-model="project.description"
                  ></b-input>
              </div>
              <div class="mb-4">
                <div class="">Contract Id <a v-if="!project.txId" href="#" @click.prevent="useMyAddress()">(use my address)</a></div>
                <b-input
                  id="projectId"
                  ref="projectId"
                  :readonly="project.txId"
                  v-model="project.projectId"
                  ></b-input>
              </div>
              <div class="mb-2" v-if="valid">
                <b-button variant="info" class="mt-3 mr-3 btn-lg" style="text-transform: capitalize; font-size: 14px;" @click.prevent="saveApplication()">Save Application</b-button>
                <b-button variant="danger" class="mt-3 btn-lg" style="text-transform: capitalize; font-size: 14px;" to="/admin-app">Back</b-button>
              </div>
            </b-form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <b-modal scrollable id="app-modal" title="Saving Application Details">
    <div class="row">
      <div class="col-12 my-1">
        <p>Saving to your decentralised storage.</p>
        <p>Won't be long.</p>
      </div>
    </div>
  </b-modal>
</div>
</template>

<script>
import { APP_CONSTANTS } from '@/app-constants'
import utils from '@/services/utils'
import SideMenu from '@/components/admin/SideMenu'
import TitleBar from '@/components/admin/TitleBar'
import AppLogoUpload from '@/components/utils/AppLogoUpload'

export default {
  name: 'UpdateApplication',
  components: {
    AppLogoUpload,
    SideMenu,
    TitleBar
  },
  data () {
    return {
      loading: true,
      useDefaultLogo: false,
      projectId: null,
      loaded: false,
      dims: { width: 250, height: 250 },
      project: {
        logo: require('@/assets/img/Group 15980.svg'),
        projectId: null,
        mintPrice: '',
        title: '',
        description: ''
      },
      contentModel1: {
        title: 'Upload logo <br/> (250x250 px)',
        errorMessage: 'A file is required.',
        popoverBody: 'Your logo  file.'
      },
      files: [],
      result: null,
      doValidate: true,
      defaultBadge: require('@/assets/img/Group 15980.svg'),
      defaultBadgeData: null
    }
  },
  watch: {
    'project.title' (val) {
      const contractName = (val) ? val.toLowerCase().replaceAll(' ', '_') : ''
      if (!this.project.projectId) {
        this.project.projectId = '.' + contractName
      } else {
        const contractAddr = this.project.projectId.split('.')[0]
        this.project.projectId = contractAddr + '.' + contractName
      }
    }
  },
  mounted () {
    this.projectId = this.$route.params.projectId
    if (!this.projectId) {
      this.loaded = true
    } else {
      this.$store.dispatch('projectStore/findProjectByProjectId', this.projectId).then((project) => {
        if (!project) {
          this.$router.push('/404')
          return
        }
        this.project = project
        this.setImage(project.imageUrl)
        if (project.imageUrl) this.project.logo = project.imageUrl
        this.loaded = true
      })
    }
  },
  methods: {
    useMyAddress: function () {
      const contractAddress = this.$store.getters[APP_CONSTANTS.KEY_PROFILE].stxAddress
      if (!this.project.projectId) {
        this.project.projectId = contractAddress + '.'
      } else if (this.project.projectId.indexOf('.') > -1) {
        const contractName = this.project.projectId.split('.')[1]
        if (contractName) {
          this.project.projectId = contractAddress + '.' + contractName
        }
      } else {
        this.project.projectId = contractAddress + this.project.projectId
      }
    },
    setByEventLogo1 (data) {
      this.files = data.media
    },
    setImage (trialImage) {
      if (!trialImage) {
        trialImage = this.defaultBadge
      }
      const $self = this
      utils.fetchBase64FromImageUrl(trialImage, document).then((data) => {
        $self.files = [{
          dataUrl: data.dataURL
        }]
      })
    },
    fileName () {
      if (this.files && this.files.length === 0) {
        return
      }
      const filename = this.files[0].name
      return filename.split(/\./)[0]
    },
    validate: function () {
      let result = true
      if (!this.project.title) {
        this.$notify({ type: 'error', title: 'Application', text: 'Please enter the title of your application' })
        result = false
      }
      if (!this.project.projectId || this.project.projectId.indexOf('.') === -1) {
        this.$notify({ type: 'error', title: 'Application', text: 'Please enter the contract id is format << address.name >>' })
        result = false
      }
      if (!this.project.description) {
        this.$notify({ type: 'error', title: 'Application', text: 'Please enter a short description of your application' })
        result = false
      }
      if (!this.files.length > 0) {
        this.$notify({ type: 'error', title: 'Application', text: 'Please upload a logo for display purposes' })
        result = false
      }
      return result
    },
    valid () {
      return this.project.title && this.project.description
    },
    saveApplication: function () {
      if (this.doValidate && !this.validate()) return
      let imageData = this.defaultBadgeData
      if (this.files && this.files.length === 1) {
        imageData = utils.getBase64FromImageUrl(this.files[0].dataUrl)
      }
      this.$bvModal.show('app-modal')
      const profile = this.$store.getters[APP_CONSTANTS.KEY_PROFILE]
      this.project.owner = profile.username
      this.$store.dispatch(APP_CONSTANTS.DISP_SAVE_PROJECT, { project: this.project, imageData: imageData }).then((project) => {
        this.$router.push('/my-app/' + project.projectId)
        this.$bvModal.hide('app-modal')
      }).catch((error) => {
        this.$notify({ type: 'error', title: 'Transfers', text: 'Error message: ' + error })
        this.$bvModal.hide('app-modal')
      })
    }
  },
  computed: {
    mediaFiles1 () {
      let files = []
      if (this.files.length > 0) {
        files = this.files
      }
      return files
    },
    contractAddressUser () {
      return this.$store.getters[APP_CONSTANTS.KEY_PROFILE].stxAddress
    },
    bannerImage () {
      if (!this.files || this.files.length === 0) {
        return
      }
      return {
        padding: '0 0 0 0',
        height: '250px',
        width: '250px',
        'background-repeat': 'no-repeat',
        'background-image': `url(${this.files[0].dataUrl})`,
        'background-position': 'center center',
        '-webkit-background-size': 'cover',
        '-moz-background-size': 'cover',
        '-o-background-size': 'cover',
        'background-size': 'cover',
        opacity: 1
      }
    }
  }
}
</script>
<style lang="scss" scoped>
</style>
