import { assert } from 'chai';
import { StateMachine } from './state-machine';

describe('StateMachine', () => {
  it('should initialize with default state "stopped"', () => {
    const sm = new StateMachine();
    assert.equal(sm.state, 'stopped');
  });

  it('should allow valid transitions from "stopped" to "idle"', () => {
    const sm = new StateMachine();
    sm.changeState('idle');
    assert.equal(sm.state, 'idle');
  });

  it('should allow valid transitions from "idle" to "running"', () => {
    const sm = new StateMachine('idle');
    sm.changeState('running');
    assert.equal(sm.state, 'running');
  });

  it('should throw on invalid transition from "stopped" to "running"', () => {
    const sm = new StateMachine('stopped');
    assert.throws(() => sm.changeState('running'), /invalid transition/);
  });

  it('should allow multiple valid transitions', () => {
    const sm = new StateMachine('stopped');
    sm.changeState('idle');
    sm.changeState('running');
    sm.changeState('stopped');
    sm.changeState('destroyed');
    assert.equal(sm.state, 'destroyed');
  });

  it('should not allow any transition from "destroyed"', () => {
    const sm = new StateMachine('destroyed');
    assert.throws(() => sm.changeState('idle'), /invalid transition/);
    assert.throws(() => sm.changeState('stopped'), /invalid transition/);
  });
});