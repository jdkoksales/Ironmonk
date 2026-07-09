'use client'
// Demonstratie-engine: een monnik-figuur met echt bewegend skelet (heup, knieën,
// schouders, ellebogen) doet elke oefening voor in een vloeiende loop — zijaanzicht,
// gecontroleerd tempo. Poses zijn hoekensets (graden), de engine interpoleert met
// easing via requestAnimationFrame. Puur SVG: licht, scherp en offline-proof.
import { useEffect, useRef } from 'react'

export type Pose = {
  x?: number; y?: number // heup-positie
  torso?: number // t.o.v. verticaal-omhoog, + = voorover (naar rechts)
  head?: number // extra kanteling t.o.v. torso
  thighF?: number; shinF?: number; footF?: number // t.o.v. verticaal-omlaag, + = naar voren
  thighB?: number; shinB?: number; footB?: number
  armUF?: number; armLF?: number // boven-/onderarm vóór, t.o.v. verticaal-omlaag
  armUB?: number; armLB?: number
}
type Frame = [Pose, number] // [pose, seconden naar deze pose]
type Pattern = { frames: Frame[]; prop?: string }

const BASE: Required<Pose> = {
  x: 100, y: 118, torso: 2, head: 0,
  thighF: 3, shinF: 1, footF: 90, thighB: -3, shinB: -1, footB: 90,
  armUF: 8, armLF: 12, armUB: -6, armLB: -2,
}
const L = { torso: 40, neck: 7, headR: 10.5, armU: 24, armL: 22, thigh: 30, shin: 29, foot: 11 }
const FLOOR = 180

const dn = (a: number) => { const r = (a * Math.PI) / 180; return [Math.sin(r), Math.cos(r)] }
const up = (a: number) => { const r = (a * Math.PI) / 180; return [Math.sin(r), -Math.cos(r)] }
const ease = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t)

function fk(p: Required<Pose>) {
  const hip: [number, number] = [p.x, p.y]
  const at = (o: [number, number], d: number[], len: number): [number, number] => [o[0] + d[0] * len, o[1] + d[1] * len]
  const sh = at(hip, up(p.torso), L.torso)
  const headC = at(sh, up(p.torso + p.head), L.neck + L.headR)
  const elF = at(sh, dn(p.armUF), L.armU); const wrF = at(elF, dn(p.armLF), L.armL)
  const elB = at(sh, dn(p.armUB), L.armU); const wrB = at(elB, dn(p.armLB), L.armL)
  const knF = at(hip, dn(p.thighF), L.thigh); const anF = at(knF, dn(p.shinF), L.shin)
  const toF = at(anF, dn(p.footF), L.foot)
  const knB = at(hip, dn(p.thighB), L.thigh); const anB = at(knB, dn(p.shinB), L.shin)
  const toB = at(anB, dn(p.footB), L.foot)
  return { hip, sh, headC, elF, wrF, elB, wrB, knF, anF, toF, knB, anB, toB }
}

// ———————————————— OEFENPATRONEN (poses in graden) ————————————————
const stand: Pose = {}
export const PATTERNS: Record<string, Pattern> = {
  squat: { prop: 'barbell-rug', frames: [
    [{ armUF: 55, armLF: 118, armUB: 55, armLB: 118 }, 0.9],
    [{ y: 146, torso: 26, thighF: 76, shinF: -16, thighB: 80, shinB: -12, armUF: 78, armLF: 128, armUB: 78, armLB: 128 }, 1.3],
    [{ armUF: 55, armLF: 118, armUB: 55, armLB: 118 }, 1.2],
  ]},
  splitsquat: { frames: [
    [{ thighF: 26, shinF: 6, thighB: -24, shinB: -30, footB: 55, armUF: 6, armUB: -6 }, 0.8],
    [{ y: 140, thighF: 68, shinF: -14, thighB: -34, shinB: -78, footB: 30, torso: 8 }, 1.1],
    [{ thighF: 26, shinF: 6, thighB: -24, shinB: -30, footB: 55 }, 1.1],
  ]},
  hinge: { prop: 'barbell', frames: [
    [{ armUF: 4, armLF: 4, armUB: 4, armLB: 4 }, 0.9],
    [{ y: 126, torso: 72, head: -30, thighF: 22, shinF: 2, thighB: 18, shinB: 0, armUF: 62, armLF: 62, armUB: 62, armLB: 62 }, 1.3],
    [{ armUF: 4, armLF: 4, armUB: 4, armLB: 4 }, 1.2],
  ]},
  brug: { frames: [ // hip thrust / glute bridge — ruglig
    [{ x: 88, y: 158, torso: 104, head: -18, thighF: 34, shinF: -6, thighB: 30, shinB: -10, armUF: 150, armLF: 150, armUB: -150, armLB: -150 }, 0.9],
    [{ x: 88, y: 138, torso: 82, head: -14, thighF: 58, shinF: -14, thighB: 54, shinB: -18, armUF: 155, armLF: 155, armUB: -155, armLB: -155 }, 1.0],
    [{ x: 88, y: 158, torso: 104, head: -18, thighF: 34, shinF: -6, thighB: 30, shinB: -10, armUF: 150, armLF: 150, armUB: -150, armLB: -150 }, 1.0],
  ]},
  hamcurl: { frames: [ // buiklig, hiel naar bil
    [{ x: 96, y: 162, torso: 96, head: -8, thighF: -80, shinF: -78, thighB: -84, shinB: -82, armUF: 160, armLF: 120, armUB: -160, armLB: -120, footF: 10, footB: 10 }, 0.8],
    [{ x: 96, y: 162, torso: 96, head: -8, thighF: -80, shinF: -6, thighB: -84, shinB: -10, armUF: 160, armLF: 120, armUB: -160, armLB: -120, footF: 60, footB: 60 }, 1.0],
    [{ x: 96, y: 162, torso: 96, head: -8, thighF: -80, shinF: -78, thighB: -84, shinB: -82, armUF: 160, armLF: 120, armUB: -160, armLB: -120, footF: 10, footB: 10 }, 1.0],
  ]},
  legext: { frames: [ // zittend, onderbeen strekt
    [{ y: 138, torso: -6, thighF: 84, shinF: -4, thighB: 80, shinB: -8, armUF: 30, armLF: 60 }, 0.8],
    [{ y: 138, torso: -6, thighF: 84, shinF: 82, thighB: 80, shinB: 78, armUF: 30, armLF: 60 }, 1.0],
    [{ y: 138, torso: -6, thighF: 84, shinF: -4, thighB: 80, shinB: -8, armUF: 30, armLF: 60 }, 1.0],
  ]},
  bench: { prop: 'bench', frames: [ // ruglig, stang boven borst
    [{ x: 92, y: 144, torso: 92, head: -6, thighF: 42, shinF: -4, thighB: 38, shinB: -8, armUF: 178, armLF: 178, armUB: 178, armLB: 178 }, 0.9],
    [{ x: 92, y: 144, torso: 92, head: -6, thighF: 42, shinF: -4, thighB: 38, shinB: -8, armUF: 120, armLF: 205, armUB: 120, armLB: 205 }, 1.1],
    [{ x: 92, y: 144, torso: 92, head: -6, thighF: 42, shinF: -4, thighB: 38, shinB: -8, armUF: 178, armLF: 178, armUB: 178, armLB: 178 }, 1.1],
  ]},
  ohp: { prop: 'barbell-hand', frames: [
    [{ armUF: 148, armLF: 208, armUB: 148, armLB: 208 }, 0.9],
    [{ armUF: 176, armLF: 178, armUB: 176, armLB: 178, head: 4 }, 1.0],
    [{ armUF: 148, armLF: 208, armUB: 148, armLB: 208 }, 1.0],
  ]},
  latraise: { prop: 'dumbbells', frames: [
    [{ armUF: 14, armLF: 16, armUB: -14, armLB: -16 }, 0.8],
    [{ armUF: 86, armLF: 88, armUB: -86, armLB: -88 }, 1.0],
    [{ armUF: 14, armLF: 16, armUB: -14, armLB: -16 }, 1.0],
  ]},
  curl: { prop: 'dumbbells', frames: [
    [{ armUF: 4, armLF: 8, armUB: 4, armLB: 8 }, 0.8],
    [{ armUF: 4, armLF: 128, armUB: 4, armLB: 128 }, 0.9],
    [{ armUF: 4, armLF: 8, armUB: 4, armLB: 8 }, 1.1],
  ]},
  pushdown: { frames: [
    [{ armUF: 18, armLF: 118, armUB: 18, armLB: 118 }, 0.8],
    [{ armUF: 18, armLF: 20, armUB: 18, armLB: 20 }, 0.9],
    [{ armUF: 18, armLF: 118, armUB: 18, armLB: 118 }, 1.0],
  ]},
  dip: { prop: 'dipbars', frames: [
    [{ y: 112, torso: 12, thighF: -12, shinF: -68, thighB: -16, shinB: -72, armUF: 6, armLF: 6, armUB: 6, armLB: 6 }, 0.9],
    [{ y: 126, torso: 22, thighF: -14, shinF: -74, thighB: -18, shinB: -78, armUF: -38, armLF: 52, armUB: -38, armLB: 52 }, 1.1],
    [{ y: 112, torso: 12, thighF: -12, shinF: -68, thighB: -16, shinB: -72, armUF: 6, armLF: 6, armUB: 6, armLB: 6 }, 1.1],
  ]},
  pushup: { frames: [
    [{ x: 74, y: 136, torso: 86, head: -12, thighF: -82, shinF: -84, thighB: -86, shinB: -88, footF: 0, footB: 0, armUF: 12, armLF: 8, armUB: 12, armLB: 8 }, 0.9],
    [{ x: 74, y: 152, torso: 88, head: -12, thighF: -83, shinF: -85, thighB: -87, shinB: -89, footF: 0, footB: 0, armUF: 62, armLF: -46, armUB: 62, armLB: -46 }, 1.1],
    [{ x: 74, y: 136, torso: 86, head: -12, thighF: -82, shinF: -84, thighB: -86, shinB: -88, footF: 0, footB: 0, armUF: 12, armLF: 8, armUB: 12, armLB: 8 }, 1.1],
  ]},
  pullup: { prop: 'rekstok', frames: [
    [{ y: 110, armUF: 176, armLF: 176, armUB: 176, armLB: 176, thighF: 8, shinF: -34, thighB: 4, shinB: -38 }, 1.0],
    [{ y: 84, armUF: 208, armLF: 132, armUB: 208, armLB: 132, thighF: 10, shinF: -40, thighB: 6, shinB: -44, head: -4 }, 1.1],
    [{ y: 110, armUF: 176, armLF: 176, armUB: 176, armLB: 176, thighF: 8, shinF: -34, thighB: 4, shinB: -38 }, 1.2],
  ]},
  row: { prop: 'barbell', frames: [
    [{ y: 132, torso: 56, head: -22, thighF: 30, shinF: -4, thighB: 26, shinB: -8, armUF: 52, armLF: 52, armUB: 52, armLB: 52 }, 0.9],
    [{ y: 132, torso: 56, head: -22, thighF: 30, shinF: -4, thighB: 26, shinB: -8, armUF: 96, armLF: 8, armUB: 96, armLB: 8 }, 0.9],
    [{ y: 132, torso: 56, head: -22, thighF: 30, shinF: -4, thighB: 26, shinB: -8, armUF: 52, armLF: 52, armUB: 52, armLB: 52 }, 1.0],
  ]},
  facepull: { frames: [
    [{ armUF: 88, armLF: 88, armUB: 88, armLB: 88 }, 0.8],
    [{ armUF: 96, armLF: 178, armUB: 96, armLB: 178, torso: -2 }, 0.9],
    [{ armUF: 88, armLF: 88, armUB: 88, armLB: 88 }, 1.0],
  ]},
  deadhang: { prop: 'rekstok', frames: [
    [{ y: 110, armUF: 177, armLF: 177, armUB: 177, armLB: 177, thighF: 5, shinF: -22, thighB: 1, shinB: -26 }, 1.6],
    [{ y: 112, armUF: 177, armLF: 177, armUB: 177, armLB: 177, thighF: 6, shinF: -23, thighB: 2, shinB: -27 }, 1.6],
  ]},
  hlr: { prop: 'rekstok', frames: [
    [{ y: 108, armUF: 177, armLF: 177, armUB: 177, armLB: 177, thighF: 5, shinF: -16, thighB: 2, shinB: -18 }, 0.9],
    [{ y: 110, armUF: 177, armLF: 177, armUB: 177, armLB: 177, thighF: 92, shinF: 88, thighB: 88, shinB: 84 }, 1.0],
    [{ y: 108, armUF: 177, armLF: 177, armUB: 177, armLB: 177, thighF: 5, shinF: -16, thighB: 2, shinB: -18 }, 1.1],
  ]},
  plank: { frames: [
    [{ x: 74, y: 140, torso: 84, head: -10, thighF: -82, shinF: -84, thighB: -85, shinB: -87, footF: 0, footB: 0, armUF: 40, armLF: -50, armUB: 40, armLB: -50 }, 2.2],
    [{ x: 74, y: 141.5, torso: 84.5, head: -10, thighF: -82, shinF: -84, thighB: -85, shinB: -87, footF: 0, footB: 0, armUF: 40, armLF: -50, armUB: 40, armLB: -50 }, 2.2],
  ]},
  pallof: { frames: [
    [{ thighF: 16, thighB: -16, shinF: 4, shinB: -4, armUF: 30, armLF: 140, armUB: 30, armLB: 140 }, 0.9],
    [{ thighF: 16, thighB: -16, shinF: 4, shinB: -4, armUF: 88, armLF: 92, armUB: 88, armLB: 92 }, 1.0],
    [{ thighF: 16, thighB: -16, shinF: 4, shinB: -4, armUF: 30, armLF: 140, armUB: 30, armLB: 140 }, 1.2],
  ]},
  calfraise: { frames: [
    [{ armUF: 10, armLF: 14 }, 0.8],
    [{ y: 111, footF: 128, footB: 128, armUF: 10, armLF: 14 }, 0.9],
    [{}, 1.1],
  ]},
  tibialis: { frames: [
    [{ torso: -8, footF: 90, footB: 90 }, 0.8],
    [{ torso: -8, footF: 44, footB: 44 }, 0.8],
    [{ torso: -8, footF: 90, footB: 90 }, 0.9],
  ]},
  bandenkel: { frames: [ // zittend, voet werkt tegen elastiek
    [{ y: 142, torso: -10, thighF: 78, shinF: 60, thighB: 82, shinB: -6, armUF: 40, armLF: 80, footF: 60 }, 0.9],
    [{ y: 142, torso: -10, thighF: 78, shinF: 60, thighB: 82, shinB: -6, armUF: 40, armLF: 80, footF: 130 }, 0.9],
    [{ y: 142, torso: -10, thighF: 78, shinF: 60, thighB: 82, shinB: -6, armUF: 40, armLF: 80, footF: 60 }, 1.0],
  ]},
  balance: { frames: [
    [{ thighB: -18, shinB: -78, armUF: 74, armLF: 78, armUB: -74, armLB: -78 }, 1.6],
    [{ torso: 4, thighB: -20, shinB: -80, armUF: 80, armLF: 84, armUB: -68, armLB: -72 }, 1.6],
    [{ thighB: -18, shinB: -78, armUF: 74, armLF: 78, armUB: -74, armLB: -78 }, 1.6],
  ]},
  ktw: { prop: 'muur', frames: [ // knee-to-wall: knie rockt naar de muur
    [{ x: 106, thighF: 22, shinF: 2, thighB: -26, shinB: -34, footB: 50, armUF: 118, armLF: 122, torso: 6 }, 0.9],
    [{ x: 106, y: 124, thighF: 44, shinF: 26, thighB: -30, shinB: -50, footB: 40, armUF: 118, armLF: 122, torso: 12 }, 1.0],
    [{ x: 106, thighF: 22, shinF: 2, thighB: -26, shinB: -34, footB: 50, armUF: 118, armLF: 122, torso: 6 }, 1.0],
  ]},
  hop: { frames: [
    [{ y: 124, torso: 10, thighF: 24, shinF: -10, thighB: 20, shinB: -14, armUF: -18, armUB: -18, armLF: -10, armLB: -10 }, 0.4],
    [{ y: 102, torso: 4, thighF: 6, shinF: -2, thighB: 2, shinB: -6, footF: 118, footB: 118, armUF: 40, armUB: 40, armLF: 44, armLB: 44 }, 0.35],
    [{ y: 124, torso: 10, thighF: 24, shinF: -10, thighB: 20, shinB: -14, armUF: -18, armUB: -18, armLF: -10, armLB: -10 }, 0.4],
  ]},
  boxjump: { prop: 'box', frames: [
    [{ x: 76, y: 130, torso: 22, thighF: 50, shinF: -14, thighB: 46, shinB: -18, armUF: -30, armUB: -30, armLF: -20, armLB: -20 }, 0.7],
    [{ x: 96, y: 88, torso: 8, thighF: 40, shinF: 6, thighB: 36, shinB: 2, armUF: 60, armUB: 60, armLF: 66, armLB: 66 }, 0.45],
    [{ x: 112, y: 116, torso: 18, thighF: 54, shinF: -10, thighB: 50, shinB: -14, armUF: 20, armUB: 20, armLF: 26, armLB: 26 }, 0.4],
    [{ x: 76, y: 130, torso: 22, thighF: 50, shinF: -14, thighB: 46, shinB: -18, armUF: -30, armUB: -30, armLF: -20, armLB: -20 }, 1.1],
  ]},
  run: { frames: [
    [{ y: 116, torso: 8, thighF: 38, shinF: 10, thighB: -30, shinB: -70, footB: 30, armUF: -28, armLF: -78, armUB: 34, armLB: 88 }, 0.34],
    [{ y: 114, torso: 8, thighF: -30, shinF: -70, footF: 30, thighB: 38, shinB: 10, armUF: 34, armLF: 88, armUB: -28, armLB: -78 }, 0.34],
    [{ y: 116, torso: 8, thighF: 38, shinF: 10, thighB: -30, shinB: -70, footB: 30, armUF: -28, armLF: -78, armUB: 34, armLB: 88 }, 0.34],
  ]},
  bike: { frames: [ // zittend, benen cirkelen
    [{ y: 134, torso: 28, thighF: 62, shinF: 6, thighB: 26, shinB: -30, armUF: 70, armLF: 90, armUB: 70, armLB: 90 }, 0.4],
    [{ y: 134, torso: 28, thighF: 26, shinF: -30, thighB: 62, shinB: 6, armUF: 70, armLF: 90, armUB: 70, armLB: 90 }, 0.4],
    [{ y: 134, torso: 28, thighF: 62, shinF: 6, thighB: 26, shinB: -30, armUF: 70, armLF: 90, armUB: 70, armLB: 90 }, 0.4],
  ]},
  rower: { frames: [ // roeier: catch → finish
    [{ x: 84, y: 150, torso: 34, head: -6, thighF: 76, shinF: -18, thighB: 74, shinB: -20, armUF: 74, armLF: 74, armUB: 74, armLB: 74 }, 0.8],
    [{ x: 104, y: 150, torso: -14, head: 4, thighF: 22, shinF: 74, thighB: 20, shinB: 72, armUF: 96, armLF: 10, armUB: 96, armLB: 10 }, 0.9],
    [{ x: 84, y: 150, torso: 34, head: -6, thighF: 76, shinF: -18, thighB: 74, shinB: -20, armUF: 74, armLF: 74, armUB: 74, armLB: 74 }, 0.9],
  ]},
  mabu: { frames: [
    [{ y: 137, thighF: 62, shinF: 6, footF: 96, thighB: -62, shinB: -6, footB: 84, armUF: 62, armLF: 132, armUB: -62, armLB: -132 }, 2.4],
    [{ y: 139, thighF: 64, shinF: 7, footF: 96, thighB: -64, shinB: -7, footB: 84, armUF: 62, armLF: 132, armUB: -62, armLB: -132 }, 2.4],
  ]},
  gongbu: { frames: [
    [{ y: 136, torso: 6, thighF: 54, shinF: -8, thighB: -38, shinB: -40, footB: 55, armUF: 84, armLF: 90, armUB: -30, armLB: -34 }, 2.4],
    [{ y: 138, torso: 7, thighF: 56, shinF: -10, thighB: -39, shinB: -41, footB: 55, armUF: 86, armLF: 92, armUB: -30, armLB: -34 }, 2.4],
  ]},
  xubu: { frames: [
    [{ y: 134, torso: -4, thighF: 30, shinF: 12, footF: 130, thighB: -46, shinB: 20, armUF: 70, armLF: 120, armUB: -50, armLB: -100 }, 2.4],
    [{ y: 136, torso: -4, thighF: 32, shinF: 14, footF: 130, thighB: -48, shinB: 22, armUF: 72, armLF: 122, armUB: -50, armLB: -100 }, 2.4],
  ]},
  wallsit: { prop: 'muur-links', frames: [
    [{ x: 92, y: 142, torso: -2, thighF: 88, shinF: -2, thighB: 84, shinB: -6, armUF: 20, armLF: 24 }, 2.4],
    [{ x: 92, y: 142.8, torso: -2, thighF: 88, shinF: -2, thighB: 84, shinB: -6, armUF: 20, armLF: 24 }, 2.4],
  ]},
  squathold: { frames: [
    [{ y: 152, torso: 18, thighF: 84, shinF: -22, thighB: 88, shinB: -18, armUF: 66, armLF: 136, armUB: 66, armLB: 136 }, 2.4],
    [{ y: 153, torso: 19, thighF: 85, shinF: -23, thighB: 89, shinB: -19, armUF: 66, armLF: 136, armUB: 66, armLB: 136 }, 2.4],
  ]},
  handstand: { frames: [
    [{ y: 96, torso: 188, head: 14, thighF: 184, shinF: 182, thighB: 178, shinB: 176, footF: 262, footB: 262, armUF: 178, armLF: 178, armUB: 174, armLB: 174 }, 2.2],
    [{ y: 96, torso: 186, head: 14, thighF: 182, shinF: 180, thighB: 180, shinB: 178, footF: 262, footB: 262, armUF: 178, armLF: 178, armUB: 174, armLB: 174 }, 2.2],
  ]},
  kick: { frames: [
    [{ thighF: 8, shinF: -4, thighB: -12, shinB: -8, armUF: 60, armLF: 130, armUB: -60, armLB: -130 }, 0.55],
    [{ thighF: 88, shinF: 20, thighB: -14, shinB: -10, armUF: 66, armLF: 136, armUB: -66, armLB: -136, torso: -6 }, 0.35],
    [{ thighF: 92, shinF: 88, thighB: -14, shinB: -10, armUF: 66, armLF: 136, armUB: -66, armLB: -136, torso: -8 }, 0.25],
    [{ thighF: 8, shinF: -4, thighB: -12, shinB: -8, armUF: 60, armLF: 130, armUB: -60, armLB: -130 }, 0.8],
  ]},
  frontsplit: { frames: [
    [{ y: 152, torso: 2, thighF: 74, shinF: 80, footF: 130, thighB: -66, shinB: -74, footB: 20, armUF: 40, armLF: 60, armUB: -40, armLB: -60 }, 2.2],
    [{ y: 158, torso: 4, thighF: 80, shinF: 85, footF: 135, thighB: -72, shinB: -80, footB: 16, armUF: 40, armLF: 60, armUB: -40, armLB: -60 }, 2.2],
  ]},
  butterfly: { frames: [
    [{ y: 152, torso: -2, thighF: 66, shinF: -58, thighB: -66, shinB: 58, footF: 150, footB: 30, armUF: 34, armLF: 96, armUB: -34, armLB: -96 }, 2.2],
    [{ y: 152, torso: 6, thighF: 70, shinF: -62, thighB: -70, shinB: 62, footF: 150, footB: 30, armUF: 38, armLF: 100, armUB: -38, armLB: -100 }, 2.2],
  ]},
  hamstring: { frames: [
    [{ torso: 46, head: -18, thighF: 14, shinF: 2, thighB: 10, shinB: -2, armUF: 60, armLF: 60, armUB: 60, armLB: 60 }, 2.0],
    [{ torso: 66, head: -24, thighF: 14, shinF: 2, thighB: 10, shinB: -2, armUF: 78, armLF: 78, armUB: 78, armLB: 78 }, 2.0],
    [{ torso: 46, head: -18, thighF: 14, shinF: 2, thighB: 10, shinB: -2, armUF: 60, armLF: 60, armUB: 60, armLB: 60 }, 2.0],
  ]},
  couch: { frames: [ // heupbuiger-stretch, knielend
    [{ y: 144, torso: -4, thighF: 44, shinF: -18, thighB: -30, shinB: -110, footB: -20, armUF: 24, armLF: 30 }, 2.0],
    [{ x: 104, y: 144, torso: -8, thighF: 50, shinF: -24, thighB: -36, shinB: -116, footB: -26, armUF: 24, armLF: 30 }, 2.0],
    [{ y: 144, torso: -4, thighF: 44, shinF: -18, thighB: -30, shinB: -110, footB: -20, armUF: 24, armLF: 30 }, 2.0],
  ]},
  dislocate: { frames: [ // schouder-dislocates met stok
    [{ armUF: 42, armLF: 44, armUB: 42, armLB: 44 }, 0.9],
    [{ armUF: 176, armLF: 178, armUB: 176, armLB: 178 }, 1.0],
    [{ armUF: -140, armLF: -142, armUB: -140, armLB: -142, torso: -4 }, 1.0],
    [{ armUF: 176, armLF: 178, armUB: 176, armLB: 178 }, 1.0],
    [{ armUF: 42, armLF: 44, armUB: 42, armLB: 44 }, 0.9],
  ]},
  meditatie: { frames: [
    [{ y: 154, torso: 0, thighF: 72, shinF: -70, thighB: -72, shinB: 70, footF: 140, footB: 40, armUF: 26, armLF: 70, armUB: -26, armLB: -70, head: 2 }, 2.6],
    [{ y: 153, torso: 0, thighF: 72, shinF: -70, thighB: -72, shinB: 70, footF: 140, footB: 40, armUF: 26, armLF: 70, armUB: -26, armLB: -70, head: 0 }, 2.6],
  ]},
  stepdown: { prop: 'box-links', frames: [
    [{ x: 96, y: 96, thighF: 10, shinF: 2, thighB: 14, shinB: 4 }, 0.8],
    [{ x: 96, y: 112, thighF: 54, shinF: -20, thighB: 20, shinB: 8, torso: 12, armUF: 50, armLF: 54 }, 1.1],
    [{ x: 96, y: 96, thighF: 10, shinF: 2, thighB: 14, shinB: 4 }, 1.1],
  ]},
}

// ———————————————— RENDERER ————————————————
function lerpPose(a: Required<Pose>, b: Required<Pose>, t: number): Required<Pose> {
  const out: any = {}
  for (const k of Object.keys(BASE) as (keyof Pose)[]) out[k] = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t
  return out
}
const full = (p: Pose): Required<Pose> => ({ ...BASE, ...p })

export function Figure({ pattern, size = 220, tint = '#e8d9b0' }: { pattern: string; size?: number; tint?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const pat = PATTERNS[pattern] || PATTERNS.meditatie

  useEffect(() => {
    const svg = ref.current
    if (!svg) return
    const frames = pat.frames.map(([p]) => full(p))
    const durs = pat.frames.map(([, d]) => d)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const start = performance.now()

    const draw = (pose: Required<Pose>) => {
      const P = fk(pose)
      const set = (id: string, pts: [number, number][]) => {
        const el = svg.querySelector(`[data-j="${id}"]`)
        if (el) el.setAttribute('points', pts.map((p) => p.join(',')).join(' '))
      }
      set('legB', [P.hip, P.knB, P.anB, P.toB])
      set('armB', [P.sh, P.elB, P.wrB])
      set('torso', [P.hip, P.sh])
      set('legF', [P.hip, P.knF, P.anF, P.toF])
      set('armF', [P.sh, P.elF, P.wrF])
      const head = svg.querySelector('[data-j="head"]')
      if (head) { head.setAttribute('cx', String(P.headC[0])); head.setAttribute('cy', String(P.headC[1])) }
      const sash = svg.querySelector('[data-j="sash"]')
      if (sash) sash.setAttribute('points', [P.sh, P.hip].map((p) => p.join(',')).join(' '))
      // props die met het lichaam meebewegen
      const bar = svg.querySelector('[data-j="prop-bar"]') as SVGGElement | null
      if (bar) {
        const anchor = pat.prop === 'barbell-rug' ? P.sh : pat.prop === 'dumbbells' ? null : P.wrF
        if (anchor) bar.setAttribute('transform', `translate(${anchor[0]} ${anchor[1]})`)
        if (pat.prop === 'dumbbells') {
          const d1 = svg.querySelector('[data-j="db1"]'); const d2 = svg.querySelector('[data-j="db2"]')
          if (d1) d1.setAttribute('transform', `translate(${P.wrF[0]} ${P.wrF[1]})`)
          if (d2) d2.setAttribute('transform', `translate(${P.wrB[0]} ${P.wrB[1]})`)
        }
      }
    }

    if (reduced || frames.length === 1) { draw(frames[0]); return }

    // Segment j loopt van frame j naar frame (j+1)%n en duurt durs[(j+1)%n] sec.
    const n = frames.length
    const segs = frames.map((_, j) => ({ from: j, to: (j + 1) % n, dur: durs[(j + 1) % n] }))
    const cycle = segs.reduce((a, s) => a + s.dur, 0)

    const tick = (now: number) => {
      let tt = ((now - start) / 1000) % cycle
      let seg = segs[0]
      for (const s of segs) {
        if (tt <= s.dur) { seg = s; break }
        tt -= s.dur
      }
      const local = Math.min(1, Math.max(0, tt / seg.dur))
      draw(lerpPose(frames[seg.from], frames[seg.to], ease(local)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [pattern]) // eslint-disable-line react-hooks/exhaustive-deps

  const lw = 7
  return (
    <svg ref={ref} viewBox="0 0 200 190" width={size} height={size * 0.86} className="mx-auto block">
      <defs>
        <linearGradient id="fig-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b36a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#d9b36a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* vloer */}
      <line x1="12" y1={FLOOR} x2="188" y2={FLOOR} stroke="#332917" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="100" cy={FLOOR} rx="58" ry="7" fill="url(#fig-glow)" />
      {/* vaste props */}
      {pat.prop === 'rekstok' && (
        <g stroke="#6e5836" strokeWidth="3">
          <line x1="52" y1="30" x2="148" y2="30" strokeLinecap="round" stroke="#9a7c4d" />
          <line x1="56" y1="30" x2="56" y2="14" opacity="0.5" />
          <line x1="144" y1="30" x2="144" y2="14" opacity="0.5" />
        </g>
      )}
      {pat.prop === 'bench' && <rect x="52" y="152" width="86" height="7" rx="3.5" fill="#3a2d1a" />}
      {pat.prop === 'muur' && <line x1="146" y1="60" x2="146" y2={FLOOR} stroke="#54422a" strokeWidth="4" />}
      {pat.prop === 'muur-links' && <line x1="70" y1="60" x2="70" y2={FLOOR} stroke="#54422a" strokeWidth="4" />}
      {pat.prop === 'box' && <rect x="118" y="142" width="46" height="38" rx="3" fill="#3a2d1a" stroke="#54422a" />}
      {pat.prop === 'box-links' && <rect x="60" y="150" width="52" height="30" rx="3" fill="#3a2d1a" stroke="#54422a" />}
      {pat.prop === 'dipbars' && (
        <g stroke="#9a7c4d" strokeWidth="3" strokeLinecap="round">
          <line x1="66" y1="118" x2="134" y2="118" opacity="0.9" />
          <line x1="70" y1="118" x2="70" y2={FLOOR} opacity="0.4" />
          <line x1="130" y1="118" x2="130" y2={FLOOR} opacity="0.4" />
        </g>
      )}
      {/* achterste ledematen */}
      <polyline data-j="legB" fill="none" stroke={tint} strokeOpacity="0.42" strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
      <polyline data-j="armB" fill="none" stroke={tint} strokeOpacity="0.42" strokeWidth={lw - 1} strokeLinecap="round" strokeLinejoin="round" />
      {/* romp + saffraan sjerp */}
      <polyline data-j="torso" fill="none" stroke={tint} strokeWidth={lw + 4} strokeLinecap="round" />
      <polyline data-j="sash" fill="none" stroke="#c0794e" strokeWidth={3.5} strokeLinecap="round" opacity="0.9" />
      {/* voorste ledematen */}
      <polyline data-j="legF" fill="none" stroke={tint} strokeWidth={lw} strokeLinecap="round" strokeLinejoin="round" />
      <polyline data-j="armF" fill="none" stroke={tint} strokeWidth={lw - 1} strokeLinecap="round" strokeLinejoin="round" />
      {/* hoofd */}
      <circle data-j="head" r={L.headR} fill={tint} />
      {/* bewegende props */}
      {(pat.prop === 'barbell' || pat.prop === 'barbell-rug' || pat.prop === 'barbell-hand') && (
        <g data-j="prop-bar">
          <line x1="-26" y1="0" x2="26" y2="0" stroke="#9a7c4d" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-26" cy="0" r="6.5" fill="#54422a" stroke="#9a7c4d" />
          <circle cx="26" cy="0" r="6.5" fill="#54422a" stroke="#9a7c4d" />
        </g>
      )}
      {pat.prop === 'dumbbells' && (
        <g data-j="prop-bar">
          <g data-j="db1"><rect x="-7" y="-3" width="14" height="6" rx="2" fill="#54422a" stroke="#9a7c4d" /></g>
          <g data-j="db2" opacity="0.5"><rect x="-7" y="-3" width="14" height="6" rx="2" fill="#54422a" stroke="#9a7c4d" /></g>
        </g>
      )}
    </svg>
  )
}
