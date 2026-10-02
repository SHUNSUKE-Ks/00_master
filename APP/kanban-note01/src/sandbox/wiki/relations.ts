export type WikiRelation = {
  target: string
  type: 'contains' | 'uses' | 'related'
}

// Raw JSON is copied without changes. This small index supplies presentation-only relations.
export const WIKI_RELATIONS: Record<string, WikiRelation[]> = {
  concept_harness: [
    { target: 'concept_loop', type: 'contains' },
    { target: 'concept_agent', type: 'contains' },
    { target: 'concept_skill', type: 'contains' },
  ],
  concept_loop: [
    { target: 'concept_learning_loop', type: 'contains' },
    { target: 'concept_orchestra', type: 'related' },
  ],
  concept_orchestra: [
    { target: 'concept_agent', type: 'contains' },
    { target: 'entity_jockey', type: 'uses' },
  ],
  concept_agent: [
    { target: 'concept_skill', type: 'uses' },
    { target: 'concept_harness_board', type: 'related' },
  ],
  concept_skill: [{ target: 'concept_learning_loop', type: 'related' }],
  concept_harness_board: [{ target: 'concept_harness', type: 'related' }],
  concept_micro_product_factory: [{ target: 'entity_json_viz_lab', type: 'uses' }],
  entity_jockey: [{ target: 'concept_orchestra', type: 'related' }],
  entity_json_viz_lab: [{ target: 'concept_micro_product_factory', type: 'related' }],
  entity_nous_hermes_portal: [{ target: 'concept_harness', type: 'related' }],
}
