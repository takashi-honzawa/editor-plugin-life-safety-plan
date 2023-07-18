<script setup lang="ts">
import { initConnection, scene } from '@archilogic/editor-connection'
import { FloorPlanEngine } from '@archilogic/floor-plan-webgl'

import {toRaw } from 'vue'
import domtoimage from 'dom-to-image';

import { addMarker } from '../utils/markers'
import { visualizePaths } from '../utils/draw'

let fpe: FloorPlanEngine

interface Props {
  modelDisplayName: null | string
  emergencyExitPositions: null | [number, number][]
  clickedPosition: null | [number, number]
  escapeRoutes: null | any[]
  selectedMarkers: any[]
}
const props = defineProps<Props>()

const connection = initConnection()
connection.once('scene-loaded', evt => {
  const container = document.getElementById('plan')
  fpe = new FloorPlanEngine({ container, options: { hideElements: ['interior'] }})
  const sceneStructure = scene.node.toJson()
  sceneStructure.ry = 0
  fpe.scene.loadSceneStructure(sceneStructure)
})
const downloadSvg = (dataUrl: string) => {
  const svgXml = dataUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, '')
  const link = document.createElement('a')
  link.setAttribute(
    'href',
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml)
  )
  link.setAttribute('download', 'life-safety-plan.svg')
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
const visualizeRoutes = (escapeRoutes) => {
  if(escapeRoutes){
    visualizePaths(fpe, escapeRoutes)
  }
}
const visualizeMarkers = () => {
  if(props.emergencyExitPositions){
    props.emergencyExitPositions.forEach(position => {
      addMarker(fpe, position, 'emergency-exit')
    })
  }
  if(props.clickedPosition) addMarker(fpe, toRaw(props.clickedPosition), 'you-are-here')
  if(props.selectedMarkers){
    const assets = fpe.resources.assets
    props.selectedMarkers.forEach(selectedMarker => {
      const selectedAsset = assets.filter(asset => asset.name === selectedMarker)
      const markerClassName = selectedMarker.replace(/\s+/g, '-').toLowerCase()
      if(selectedAsset.length === 0)return
      selectedAsset.forEach(asset => {
        addMarker(fpe, [asset.position.x, asset.position.z], markerClassName)
      })
    })
  }
}
const downloadSheet = () => {
  const sheet = document.getElementById('sheet')
  domtoimage
    .toSvg(sheet)
    .then(function (dataUrl: string) {
      downloadSvg(dataUrl)
    })
}

defineExpose({
  visualizeRoutes,
  visualizeMarkers,
  downloadSheet
})
</script>

<template>
  <div id="sheet">
    <div id="header">
      <h1 class="title">Life Safety Plan</h1>
      <h1 class="title">{{modelDisplayName}}</h1>
    </div>
    <div id="main">
      <div id="plan"></div>
      <div id="legend">
        <ul >
          <li v-if="escapeRoutes" key="escape-routes">
            <div 
              class='route'
              ></div>
              <span>Escape Route</span>
          </li>
          <li v-if="clickedPosition" key="you-are-here">
            <div 
              class='markers-legend you-are-here'
              ></div>
            <span>Your Location</span>
          </li>
          <li v-if="emergencyExitPositions" key="emergency-exit">
            <div 
              class='markers-legend emergency-exit'
              ></div>
            <span>Emergency Exit</span>
          </li>
          <li v-for="item in selectedMarkers" :key="item">
            <div 
              class='markers-legend'
              :class="item.replace(/ /g, '-').toLowerCase()"></div>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style>
#sheet {
  height: 800px;
  width: 1040px;
}
#header {
  height: calc(20%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
}
.title {
  font-size: 2em;
  margin: 0;
}
#main {
  height: calc(80% - 30px);
  display: flex;
  padding: 0 30px 30px 30px;
}
#plan {
  width: calc(70% - 10px);
  height: 100%;
  margin-right: 10px;
}
#legend {
  width: calc(30% - 10px);
  height: 100%;
  margin-left: 10px;
}

ul {
  list-style: none;
}
li {
  margin-bottom: 6px;
}
.route {
  display: inline-block;
  width: 28px;
  margin-bottom: 4px;
  border: none;
  border-top: 2px dashed #00ff00;
}
.markers-legend {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: 100%;
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
}
span {
  margin-left: 10px;
  line-height: 28px;
  vertical-align: top;
}
</style>