<script setup lang="ts">
import { initConnection, scene } from '@archilogic/editor-connection'
import { FloorPlanEngine } from '@archilogic/floor-plan-webgl'
import { AButton, ASeparator } from '@archilogic/ui-components'
import { getMergedSpace, polygonPerimeter } from '@archilogic/scene-structure'

import Sheet from './components/Sheet.vue'
import { getPath } from './analysis/pathfinding'
import { addMarker, removeMarkers } from './utils/markers'
import { visualizePaths } from './utils/draw'
import FPEEvtObject from './types/FPEEvtObject'

import { reactive, ref } from 'vue'

let fpe: FloorPlanEngine
let walkableSpace: any
let emergencyExits: any
let emergencyExitPositions: null | [number, number][] = null
let escapeRoutes: null | any[] = null

let youAreHereMarker: any
let exitMarkers: any[] = []
let optionalMarkers: any[] = []

const sheetComponentRef = ref(null);

const state: {
  isLoaded: boolean
  appVersion: string
  floorId: null | string
  modelDisplayName: null | string
  clickedPosition: null | [number, number]
  selections: any[]
  markerPoints: any[]
} = reactive({
  isLoaded: false,
  appVersion: '',
  floorId: null,
  modelDisplayName: null,
  clickedPosition: null,
  selections: [],
  markerPoints: []
})

// initialize the connection to editor and listen to main events
const connection = initConnection()
connection.once('scene-loaded', evt => {
  const container = document.getElementById('plan-preview')
  fpe = new FloorPlanEngine({ container, options: { hideElements: ['interior'] }})
  const sceneStructure = scene.node.toJson()
  sceneStructure.ry = 0
  fpe.scene.loadSceneStructure(sceneStructure)
  fpe.loader.on('loading-done', () => {
    state.floorId = fpe.scene.node.id
    state.modelDisplayName = fpe.scene.node.modelDisplayName
    walkableSpace = getMergedSpace(fpe.scene)
    emergencyExits = fpe.resources.assets.filter(asset => asset.productId == 'b76ebd68-59d5-48c8-af38-0cd9d514c05c')
    emergencyExitPositions = emergencyExits.map(exit => [exit.position.x, exit.position.z])
    visualizeExits(emergencyExits)
    state.isLoaded = true
  })
  fpe.on('click', (event: FPEEvtObject) => {
    const pos: number[] = event.pos;
    const position: [number, number] = [pos[0], pos[1]]
    state.clickedPosition = position
    if(youAreHereMarker){
      youAreHereMarker.remove()
      youAreHereMarker = null
    }
    youAreHereMarker = addMarker(fpe, position, 'you-are-here')
    findPaths(fpe, position)
  })
})
const visualizeExits = (emergencyExits: any[]) => {
  removeMarkers(exitMarkers)
  exitMarkers = []
  if(emergencyExits.length !== 0){
    emergencyExits.forEach(exit => {
      const marker = addMarker(fpe, [exit.position.x, exit.position.z], 'emergency-exit')
      exitMarkers.push(marker)
    })
  }
}
const findPaths = (fpe: FloorPlanEngine, position: [number, number]) => {
  const distancePathArr: any[] = [];
  emergencyExits.forEach(exit => {
    const { shapes: pathShapes } = getPath({
      space: walkableSpace,
      options: {
        startPoint: position,
        endPoint: [exit.position.x, exit.position.z]
      }
    })
    const distance = Math.round(polygonPerimeter(pathShapes[0], false) * 10) / 10
    distancePathArr.push({distance, path: pathShapes})
  })

  distancePathArr.sort((a, b) => a.distance - b.distance);

  if (distancePathArr.length === 0) {
    return
  } else if (distancePathArr.length === 1) {
    escapeRoutes = [distancePathArr[0]]
    visualizePaths(fpe, escapeRoutes)
    sheetComponentRef.value.visualizeRoutes(escapeRoutes)

  } else {
    escapeRoutes = [distancePathArr[0], distancePathArr[1]]
    visualizePaths(fpe, escapeRoutes)
    sheetComponentRef.value.visualizeRoutes(escapeRoutes)
  }
}
const placeAssets = () => {
  removeMarkers(optionalMarkers)
  optionalMarkers = []

  if(state.selections.length === 0)return
  const assets = fpe.resources.assets

  state.selections.forEach(selection => {
    const selectedAsset = assets.filter(asset => asset.name === selection)
    const markerClassName = selection.replace(/\s+/g, '-').toLowerCase()
    if(selectedAsset.length === 0)return
    selectedAsset.forEach(asset => {
      const marker = addMarker(fpe, [asset.position.x, asset.position.z], markerClassName)
      optionalMarkers.push(marker)
    })
  })
}
const exportFloorPlan = () => {
  sheetComponentRef.value.visualizeMarkers()
  sheetComponentRef.value. downloadSheet()
}
</script>

<template>
  <div class="container mx-auto p-4">
    <h3 class="heading-md">Life Safety Plan Generator</h3>
    <a-separator class="my-4" />
    <h4 class="heading-sm h-10">Safety Assets to include:</h4>
    <div>
      <input type="checkbox" id="fire-alarm" value="Fire Alarm" v-model="state.selections"/>
      <label for="fire-alarm" >Fire Alarm</label> 
      <br/>
      <input type="checkbox" id="fire-hose" value="Fire Hose Reel" v-model="state.selections"/>
      <label for="fire-hose" >Fire Hose</label> 
      <br/>
      <input type="checkbox" id="fire-ext" value="Fire Extinguisher" v-model="state.selections"/>
      <label for="fire-ext" >Fire Extinguisher</label>
      <br/>
      <input type="checkbox" id="aed" value="AED Kit" v-model="state.selections"/>
      <label for="aed" >AED</label>
      <br/>
      <a-button
        class="bg-grey my-4"
        :disabled="!state.isLoaded"
        @click="placeAssets()"
      >
        Update Safety Assets
      </a-button>
    </div>
    <p style="font-size: 0.9em; margin-bottom: 2px">Click on the floor plan to place an origin icon</p>
    <div id="plan-preview" style="height: 300px"></div>
    <a-button
      class="bg-grey my-4"
      :disabled="!state.isLoaded"
      @click="exportFloorPlan()"
    >
      Export as SVG
    </a-button>
  </div>
  <Sheet 
    ref="sheetComponentRef"
    :modelDisplayName="state.modelDisplayName"
    :emergencyExitPositions="emergencyExitPositions"
    :clickedPosition="state.clickedPosition"
    :escapeRoutes="escapeRoutes"
    :selectedMarkers="state.selections"
  />
</template>
<style>
body {
  overflow: hidden
}
label {
  margin-left: 4px;
}
.markers{
  width: 16px;
  height: 16px;
  border-radius: 100%;
  background-size: 100%;
  background-position: center;
  background-repeat: no-repeat;
}
.you-are-here {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/you-are-here.png');
}
.emergency-exit {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/markers/emergency-exit.png');
}
.fire-alarm {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/markers/fire-alarm.png');
}
.fire-hose-reel {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/markers/fire-hose.png');
}
.fire-extinguisher {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/markers/fire-extinguisher.png');
}
.aed-kit {
  background-image: url('https://takashi-honzawa.github.io/retool-template-icons/markers/AED.png');
}
</style>