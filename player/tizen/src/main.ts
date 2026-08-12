import { HelloWorld } from '@fluid/HelloWorld';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (root) {
  const hello = new HelloWorld();
  root.textContent = hello.helloWorld();
}
