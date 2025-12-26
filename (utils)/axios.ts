import axios from 'axios';

export const apiurl= 'http://192.168.1.7:5000/api'

export const api = axios.create({
  baseURL: 'http://192.168.1.7:5000/api',
});