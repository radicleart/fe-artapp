<template>
<div class="row">
  <side-menu class="col-3 mr-0 pr-0 pt-5"/>
  <div class="col-9 pt-5 admin-app">
    <title-bar class="container" v-on="$listeners"/>
    <div class="container" @click="$emit('toggle-off-navbar')">
    <b-tabs
      nav-class="font-weight-bold text-uppercase text-info"
      nav-wrapper-class="font-weight-bold text-uppercase bg-info text-info"
      active-nav-item-class="font-weight-bold text-uppercase text-info"
      active-tab-class="text-info"
      content-class="mt-3 px-3 pt-5"
      >
      <b-tab title="App Registry" active>
        <app-registry/>
      </b-tab>
      <b-tab title="API Settings">
        <api-settings/>
      </b-tab>
      <b-tab title="Search Settings">
        <search-settings/>
      </b-tab>
    </b-tabs>
    </div>
  </div>
</div>
</template>

<script>
import SideMenu from '@/components/admin/SideMenu'
import TitleBar from '@/components/admin/TitleBar'
import AppRegistry from '@/components/admin/system/AppRegistry'
import ApiSettings from '@/components/admin/system/ApiSettings'
import SearchSettings from '@/components/admin/system/SearchSettings'

export default {
  name: 'SystemSettings',
  components: {
    SideMenu,
    TitleBar,
    AppRegistry,
    SearchSettings,
    ApiSettings
  },
  data () {
    return {
      showNavbar: false
    }
  },
  mounted () {
    this.loading = false
    this.$store.dispatch('projectStore/fetchMyProjects')
  },
  methods: {
  },
  computed: {
  }
}
</script>
<style lang="scss">
@import "@/assets/scss/custom.scss";
</style>
