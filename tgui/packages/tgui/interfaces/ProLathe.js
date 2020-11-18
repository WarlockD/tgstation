import { classes } from 'common/react';
import { uniqBy } from 'common/collections';
import { useBackend, useLocalState, useSharedState } from '../backend';
import { formatSiUnit, formatMoney } from '../format';
import { Flex, Section, Tabs, Box, Button, Fragment, ProgressBar, NumberInput, Icon, Input, Tooltip , Dropdown } from '../components';
import { Window } from '../layouts';
import { createSearch } from 'common/string';
import { createLogger } from "../logging";
import { clamp, inRange } from 'common/math';

const logger = createLogger("Prolathe");

const MATERIAL_KEYS = {
  "iron": "sheet-metal_3",
  "glass": "sheet-glass_3",
  "silver": "sheet-silver_3",
  "gold": "sheet-gold_3",
  "diamond": "sheet-diamond",
  "plasma": "sheet-plasma_3",
  "uranium": "sheet-uranium",
  "bananium": "sheet-bananium",
  "titanium": "sheet-titanium_3",
  "bluespace crystal": "polycrystal",
  "plastic": "sheet-plastic_3",
};

const COLOR_NONE = 0;
const COLOR_AVERAGE = 1;
const COLOR_BAD = 2;

const COLOR_KEYS = {
  [COLOR_NONE]: false,
  [COLOR_AVERAGE]: "average",
  [COLOR_BAD]: "bad",
};

const materialArrayToObj = materials => {
  let materialObj = {};

  materials.forEach(m => {
    materialObj[m.name] = m.amount; });

  return materialObj;
};




const partBuildColor = (cost, tally, material) => {
  if (cost > material) {
    return { color: COLOR_BAD, deficit: (cost - material) };
  }

  if (tally > material) {
    return { color: COLOR_AVERAGE, deficit: cost };
  }

  if (cost + tally > material) {
    return { color: COLOR_AVERAGE, deficit: ((cost + tally) - material) };
  }

  return { color: COLOR_NONE, deficit: 0 };
};

const partCondFormat = (materials, tally, part) => {
  let format = { "textColor": COLOR_NONE };

  if (part.material_cost) {
    Object.keys(part.material_cost).forEach(mat => {
      format[mat] = partBuildColor(part.material_cost[mat],
        tally[mat], materials[mat]);

      if (format[mat].color > format["textColor"]) {
        format["textColor"] = format[mat].color;
      }
    });
  }
  if (part.reagent_cost) {
    Object.keys(part.reagent_cost).forEach(mat => {
      format[mat] = partBuildColor(part.reagent_cost[mat],
        tally[mat], materials[mat]);

      if (format[mat].color > format["textColor"]) {
        format["textColor"] = format[mat].color;
      }
    });
  }
  return format;
};


const queueCondFormat = (materials, queue) => {
  let materialTally = {};
  let matFormat = {};
  let missingMatTally = {};
  let textColors = {};

  queue.forEach((part, i) => {
    textColors[i] = COLOR_NONE;

    Object.keys(part.material_cost).forEach(mat => {
      materialTally[mat] = materialTally[mat] || 0;
      missingMatTally[mat] = missingMatTally[mat] || 0;

      matFormat[mat] = partBuildColor(
        part.material_cost[mat], materialTally[mat], materials[mat]
      );

      if (matFormat[mat].color !== COLOR_NONE) {
        if (textColors[i] < matFormat[mat].color) {
          textColors[i] = matFormat[mat].color;
        }
      }
      else {
        materialTally[mat] += part.material_cost[mat];
      }

      missingMatTally[mat] += matFormat[mat].deficit;
    });


  });
  return { materialTally, missingMatTally, textColors, matFormat };
};


const searchFilter = (search, allparts) => {
  let searchResults = [];

  if (!search.length) {
    return;
  }

  const resultFilter = createSearch(search, part => (
    (part.name || "")
    + (part.desc || "")
    + (part.searchMeta || "")
  ));

  Object.keys(allparts).forEach(category => {
    allparts[category]
      .filter(resultFilter)
      .forEach(e => { searchResults.push(e); });
  });

  searchResults = uniqBy(part => part.name)(searchResults);

  return searchResults;
};

const staticUpdate = (context, allParts) => {
  const { data } = useBackend(context);
  let updateCount = 0
  Object.keys(categories_of_parts).forEach(category => {
    const category_parts = categories_of_parts[category];
    category_parts.forEach(part => {
      if(allParts[part.id])
        continue; // skip if already included
        updateCount++;
        allParts[part.id] = part;
      if(part.custom_materials) {// if we got custom materials set up some defaults
        part.default_custom_material = {}
        Object.keys(part.custom_materials).forEach(cat => {
          const materials = materialCategories[cat]; // random default matinal because we are dicks
          part.selected_custom_material[cat] = materials[Math.floor(Math.random() * materials.length)];
        });
  }})});
  return updateCount;
}

const normalUpdate = (context) {

}
/*  setup the initial shared cache.
 * everything from the time parts take to make, to the materials
 * they cost to the default materials used on custom mats
 * This should be rerun when researchedDesigns is updated
 */
const setupLocalPartsCache = (context) => {
  const { data } = useBackend(context);

  const materialObj = materialArrayToObj(data.materials || []);
  let allParts = {};
  staticUpdate(context,allParts);

  // get the material use for the queueGetMatieralSheetSprite
  const {
    materialTally,
    missingMatTally,
    textColors,
  } = queueCondFormat(materialObj, queue);
  // set the display settings for parts
  Object.values(allParts).forEach(part => {
    part["format"] = partCondFormat(materialObj, materialTally, part);
  });
  // return an object of all the cached local stuff
  return {
    materialObj: materialObj,
    allParts: allParts,
    materialTally: materialTally,
    missingMatTally: missingMatTally,
    textColors: textColors,
    last_update: data.update_time,
  };

};


export const ProLathe = (props, context) => {
  const { data } = useBackend(context);
  // order matters
  const department_tag = data.departmentTag || "BAD DEPARTMENT TAG";

  const [
    selectedSettings,
    setSelectedSettings,
  ] = useSharedState(context, "settings_tab", "Materials");

  // Most of the setup work for the db goes setupLocalPartsCache
  // If your changing the prolathe ui_data or ui_static data, be sure
  // to check setupLocalPartsCache if it needs changes
  const [
    cache,
  ] = useSharedState(context, "local_cache", setupLocalPartsCache(context));

  //
  if(data.update_time != cache.update_time) {
    logger.log("ui_static changed and/or updated");
    staticUpdate(context,cache.allParts);
    cache.update_time = data.udpate_time;
  };



  return (
    <Window
      resizable
      title={department_tag}
      width={1100}
      height={640}>
      <Window.Content
        scrollable>
        <Flex
          fillPositionedParent
          direction="column">
          <Flex >
            <Flex.Item height="125px"
              mt={1}
              ml={1}>
              <Section height="100%">
                <Tabs
                  vertical>
                  <Tabs.Tab
                    selected={selectedSettings === "Materials"}
                    onClick={() => setSelectedSettings("Materials")}>
                    Materials Storage
                  </Tabs.Tab>
                  {(!!(data.regents) && (
                    <Tabs.Tab
                      selected={selectedSettings === "Regents"}
                      disabled={!(data.regents)}
                      onClick={() => setSelectedSettings("Regents")}>
                      Regent Storage
                    </Tabs.Tab>
                  ))}
                  <Tabs.Tab
                    selected={selectedSettings === "Settings"}
                    onClick={() => setSelectedSettings("Settings")}>
                    Settings
                  </Tabs.Tab>
                </Tabs>
              </Section>
            </Flex.Item>
            <Flex.Item
              ml={1}
              mr={1}
              mt={1}
              basis="content"
              grow={1}>
              {selectedSettings === "Materials" ? (<Materials />)
                :selectedSettings === "Regents" ? (<Reagents />)
                  :selectedSettings === "Settings" ? (<Settings />)
                    : "ERROR IN TAB MENU"}
            </Flex.Item>
          </Flex>
          <Flex.Item
            grow={1}
            m={1}>
            <Flex
              spacing={1}
              height="100%"
              overflowY="hide">
              <Flex.Item position="relative" basis="content">
                <Section
                  height="100%"
                  overflowY="auto"
                  title="Categories">
                  <PartSets />
                </Section>
              </Flex.Item>
              <Flex.Item
                position="relative"
                grow={1}>
                <Box
                  fillPositionedParent
                  overflowY="auto">
                  <PartLists
                    availableMaterials={cache.materialTally}
                    materials={cache.materialAsObj} />
                </Box>
              </Flex.Item>
              <Flex.Item
                width="420px"
                position="relative">
                <Queue
                  queue={cache.queue}
                  missingMaterials={cache.missingMatTally}
                  queueMaterials={cache.materialTally}
                  textColors={cache.textColors} />
              </Flex.Item>
            </Flex>
          </Flex.Item>
        </Flex>
      </Window.Content>
    </Window>
  );
};

const Materials = (props, context) => {
  const { data } = useBackend(context);

  const materials = data.materials || [];

  return (
    <Section height="100%"
      title="Materials">
      <Flex
        wrap="wrap">
        {materials.map(material => (
          material.isMaterial && (
            <Flex.Item
              width="80px"
              key={material.name}>
              <MaterialAmount
                name={material.name}
                amount={material.amount}
                formatsi />
              <Box
                mt={1}
                style={{ "text-align": "center" }}>
                <EjectMaterial
                  material={material} />
              </Box>
            </Flex.Item>
          )))}
      </Flex>
    </Section>
  );
};

const EjectMaterial = (props, context) => {
  const { act } = useBackend(context);

  const { material } = props;

  const {
    name,
    removable,
    sheets,
    ref,
  } = material;

  const [
    removeMaterials,
    setRemoveMaterials,
  ] = useSharedState(context, "remove_mats_" + name, 1);

  if ((removeMaterials > 1) && (sheets < removeMaterials)) {
    setRemoveMaterials(sheets || 1);
  }

  return (
    <Fragment>
      <NumberInput
        width="30px"
        animated
        value={removeMaterials}
        minValue={1}
        maxValue={sheets || 1}
        initial={1}
        onDrag={(e, val) => {
          const newVal = parseInt(val, 10);
          if (Number.isInteger(newVal)) {
            setRemoveMaterials(newVal);
          }
        }} />
      <Button
        icon="eject"
        disabled={!removable}
        onClick={() => act("remove_mat", {
          ref: ref,
          amount: removeMaterials,
        })} />
    </Fragment>
  );
};

const Settings = (props, context) => {
  const [
    displayMatCost,
    setDisplayMatCost,
  ] = useSharedState(context, "display_mats", false);

  return (
    <Section height="100%"
      title="Settings">
      <Button.Checkbox
        onClick={() => setDisplayMatCost(!displayMatCost)}
        checked={displayMatCost}>
        Display Material Costs
      </Button.Checkbox>
    </Section>
  );
};



const ReagentAmount = (props, context) => {
  const { data } = useBackend(context);

  const {
    name,
    amount,
    formatsi,
    formatmoney,
    beaker_color,
    color,
  } = props;

  const regents_max_volume = data.regents_max_volume || 0;
  const regents_total_volume = data.regents_total_volume || 0;
  //   <Tooltip content={name} position='right' data-tooltip={name}/>
  return (
    <Flex
      direction="column" data-tooltip={name}
      align="center">
      <Flex.Item>
        <Box textColor={color} textAlign="center">
          {name}
        </Box>
      </Flex.Item>
      <Flex.Item>
        <Box position="relative" height="32px" width="32px">
          <Box position="absolute" top="15px" left="11px" width="10px" height="6px" backgroundColor={beaker_color} />
          <Box position="absolute" top={0} left={0} opacity={0.5}
            className={classes([
              'sheetmaterials32x32',
              'beaker',
            ])} />
        </Box>
      </Flex.Item>
      <Flex.Item>
        <Box
          textColor={color}
          style={{ "text-align": "center" }}>
          {((formatsi && formatSiUnit(amount, 0))
            || (formatmoney && formatMoney(amount))
            || (amount)) + "u"}
        </Box>
      </Flex.Item>
    </Flex>
  );
};

const Reagents = (props, context) => {
  const { act, data } = useBackend(context);

  const regents = data.materials || [];
  const regents_max_volume = data.regents_max_volume || 0;
  const regents_total_volume = data.regents_total_volume || 0;

  return (
    <Section height="100%"
      title={"Reagents " + formatSiUnit(regents_total_volume, 0) + "/" + formatSiUnit(regents_max_volume, 0) +"u"}
      buttons={
        (<Button
          disabled={!regents_total_volume}
          content="Purge All"
          color="good"
          onClick={() => act("purge_reagents")}
        />)
      }>
      <Flex
        wrap="wrap">
        {regents.map(regent =>
          (!regent.isMaterial && (
            <Flex.Item
              width="80px"
              key={regent.name}>
              <ReagentAmount
                name={regent.name}
                amount={regent.amount}
                beaker_color={regent.color}
                formatsi />
            </Flex.Item>
          )))}
      </Flex>
    </Section>
  );
};

const MaterialAmount = (props, context) => {
  const {
    name,
    amount,
    formatsi,
    formatmoney,
    color,
    style,
  } = props;

  return (
    <Flex
      direction="column"
      align="center">
      <Flex.Item>
        <Box
          className={classes([
            'sheetmaterials32x32',
            MATERIAL_KEYS[name],
          ])}
          style={style} />
      </Flex.Item>
      <Flex.Item>
        <Box
          textColor={color}
          style={{ "text-align": "center" }}>
          {(formatsi && formatSiUnit(amount, 0))
          || (formatmoney && formatMoney(amount))
          || (amount)}
        </Box>
      </Flex.Item>
    </Flex>
  );
};


const getFirstValidPartSet = (sets, valid_sets) => {
  for (const set of sets) {
    if (valid_sets[set]) {
      return set;
    }
  }
  return null;
};

const PartSets = (props, context) => {
  const { data } = useBackend(context);

  const {
    categoryOrder,
    researchedDesigns,
  } = data;


  const [
    selectedPartTab,
    setSelectedPartTab,
  ] = useSharedState(
    context,
    "part_tab",
    getFirstValidPartSet(categoryOrder, researchedDesigns)
  );

  return (
    <Tabs
      vertical>
      {categoryOrder.map(set => (
        !!(researchedDesigns[set]) && (
          <Tabs.Tab
            key={"catagory_tab_" + set}
            selected={set === selectedPartTab}
            onClick={() => setSelectedPartTab(set)}>
            {set}
          </Tabs.Tab>
        )
      ))}
    </Tabs>
  );
};

const PartLists = (props, context) => {
  const { data } = useBackend(context);

  const {
    categoryOrder,
    researchedDesigns,
  } = data;


  const [
    selectedPartTab,
  ] = useSharedState(
    context,
    "part_tab",
    getFirstValidPartSet(categoryOrder, researchedDesigns)
  );

  const [
    searchText,
    setSearchText,
  ] = useSharedState(context, "search_text", "");

  let partsList = searchText && searchText != ""
    ? searchFilter(searchText, researchedDesigns)
    : researchedDesigns[selectedPartTab];


  return (
    <Fragment>
      <Section>
        <Flex>
          <Flex.Item mr={1}>
            <Icon
              name="search" />
          </Flex.Item>
          <Flex.Item
            grow={1}>
            <Input
              fluid
              placeholder="Search for..."
              onInput={(e, v) => setSearchText(v)} />
          </Flex.Item>
        </Flex>
      </Section>
      {searchText ? (
        <PartCategory
          name={"Search Results"}
          parts={partsList}
          forceShow
          placeholder="No matching results..." />
      ) : (
        <PartCategory
          name={selectedPartTab}
          parts={partsList} />
      )}
    </Fragment>
  );
};

const PartItem = (props, context) => {
  const { act, data } = useBackend(context);

  const {
    part,
  } = props;

  const {
    custom_materials,
    material_cost,
    reagent_cost,
  } = part;

  const {
    buildingPart,
    materialCategories,
  } = data;

  const [
    displayMatCost,
  ] = useSharedState(context, "display_mats", false);

  const [
    customPartMaterial,
    setCustomPartMaterial,
  ] = useSharedState(context, "custom_material_selection", {});
  const selectCustomMaterial = (cat,mat) => {
    const DB = customPartMaterial;
    if(!DB.hasOwnProperty(part.id))
      DB[part.id] = {};
    DB[part.id][cat] = mat;
    setCustomPartMaterial(DB);
  };
  const getSelectCustomMaterial = (cat) => {
    const DB = customPartMaterial;
    if(!DB.hasOwnProperty(part.id))
      return "None Selected"
    if(!DB[part.id].hasOwnProperty(cat))
      return "None Selected"
    return DB[part.id][cat];
  };
  return (
    <Fragment>
      <Flex
        align="center">

        <Flex.Item>
          <Button
            disabled={buildingPart
          || (part.format && part.format.textColor === COLOR_BAD)}
            color="good"
            height="20px"
            mr={1}
            icon="play"
            onClick={() => act("build_part", { id: part.id })} />
        </Flex.Item>
        <Flex.Item>
          <Button
            color="average"
            height="20px"
            mr={1}
            icon="plus-circle"
            onClick={() => act("add_queue_part", { id: part.id })} />
        </Flex.Item>

        <Flex.Item>
          <Box
            inline
            textColor={part.format && part.format.textColor && COLOR_KEYS[part.format.textColor]}>
            {part.name}
          </Box>
        </Flex.Item>
        <Flex.Item
          grow={1} />
        <Flex.Item>
          <Button
            icon="question-circle"
            transparent
            height="20px"
            tooltip={
              "Build Time: "
          + part.printTime + "s. "
          + (part.desc || "")
            }
            tooltipPosition="left" />
        </Flex.Item>
      </Flex>
      {custom_materials && (
        Object.keys(custom_materials).map(mat_cat => (
          <Dropdown
          width="200px"
          selected={getSelectCustomMaterial(mat_cat)}
          onSelected={M => selectCustomMaterial(mat_cat,M)}
          options={materialCategories[mat_cat].map(M => M.name)}
        />))
      )}
      {(displayMatCost && (
        <Flex mb={2}>
          {Object.keys(part.material_cost).map(material => (
            <Flex.Item
              width={"50px"}
              key={material}
              color={part.format && COLOR_KEYS[part.format[material].color]}>
              <MaterialAmount
                formatmoney
                style={{
                  transform: 'scale(0.75) translate(0%, 10%)',
                }}
                name={material}
                amount={part.material_cost[material]} />
            </Flex.Item>
          ))}
        </Flex>
      ))}

    </Fragment>


  );
};


/*
 * Display the list of parts
 *
 * This looks complicated because of all the sorting needed for sub catagories.
 * 1. If an item has no subcategory it is displayed at the top, first.
 * 2. If we are sent an an order on how we want to display subcategory's
 * the items are placed in each named sub category and displayed next
 * 3. If an item has a sub category, but was not mentioned in the order
 *    list, then we display it at the end
 *
 * This seems like a lot (like why not force all designs to have sub catagories)
 * but this covers allot of use cases.  I am sure, eventually, all items will
 * be organized for the lathe.
 *
 */

const PartCategory = (props, context) => {
  const { act, data } = useBackend(context);

  const {
    parts,
    name,
    forceShow,
    placeholder,
  } = props;
  //  catagories
  const partCompare = (L, R) => L.name.localeCompare(R.name);

  // This is the order of the sub categories we got from byond
  const sub_category_display_order = data.subCategoryOrder[name] || [];
  // We turn it into a look up list so we can search it faster
  let all_sub_categories_used = {};
  sub_category_display_order.forEach(cat => all_sub_categories_used[cat] = true);


  //  List of all the parts in the proper sub categories
  let all_sub_category = {};
  // List of categories that were not sent to by byond
  // (aka they were just in the design objs)
  // to be sorted latter

  let all_non_ordered_categories = [];
  // Insert the part into the right sub category and mark the categories
  // that are used
  const insert_into_subcategory = (sub_category_name, part) => {
    if (!Array.isArray(all_sub_category[sub_category_name]))
    { all_sub_category[sub_category_name] = []; }
    all_sub_category[sub_category_name].push(part);
    if (!all_sub_categories_used[sub_category_name]) {
      all_sub_categories_used[sub_category_name] = true;
      all_non_ordered_categories.push(sub_category_name);
    }
  };
  // Filter out all parts that have no subcategories defined
  const non_categorized_parts = parts.filter(part => {
    const sub_category = part.sub_category;
    if (typeof(sub_category) === "string" && sub_category.length > 0) {
      insert_into_subcategory(sub_category, part);
      return false;
    } else if (Array.isArray(sub_category)) {
      sub_category.forEach(sub_category_name =>
        insert_into_subcategory(sub_category_name, part));
      return false;
    }
    else {
      return true;
    } // no sub category
  });
  const ordered_subcategories_list = sub_category_display_order
    .filter(sub_category_name => !!all_sub_category[sub_category_name])
    .concat(all_non_ordered_categories.sort());

  /* The order of printing the sub catagories is as follows.
    1. All non categorized parts are printed FIRST
    2. If we have a hard set category list, then that is printed next
    3. Other sub_catagories are printed after that
  */


  return (
    ((!!non_categorized_parts.length || forceShow) && (
      <Section title={name}>
        {(!!non_categorized_parts.length) && (placeholder)}
        {non_categorized_parts.sort(partCompare).map(part =>
          (<PartItem key={part.id} part={part} />))}
        {!!ordered_subcategories_list.length
            && ordered_subcategories_list
              .map(sub_category_name => (
                <Section
                  key={name + "_" + sub_category_name}
                  title={sub_category_name}
                  buttons={sub_category_name === "Parts" && (
                    <Button
                      color="good"
                      content="Queue All"
                      icon="plus-circle"
                      onClick={() => act("add_queue_set", {
                        part_list: all_sub_category[sub_category_name]
                          .map(part => part.id),
                      })} />)}>
                  {all_sub_category[sub_category_name]
                    .sort(partCompare).map(part =>
                      (<PartItem part={part}
                        key={name + "_" + sub_category_name + "_" + part.id} />)
                    )}
                </Section>
              ))}
      </Section>
    ))
  );
};

const Queue = (props, context) => {
  const { act, data } = useBackend(context);

  const { isProcessingQueue } = data;


  // convert the queue into a queue of parts
  const queue = data.queue ? data.queue.map(id => allParts[id]) : [];

  const [
    cache,
  ] = useSharedState(context, "local_cache", setupLocalPartsCache(context));

  const {
    queueMaterials,
    missingMaterials,
    textColors,
  } = queueCondFormat(cache.materialObj, queue);

  return (
    <Flex
      height="100%"
      width="100%"
      direction="column">
      <Flex.Item
        height={0}
        grow={1}>
        <Section
          height="100%"
          title="Queue"
          overflowY="auto"
          buttons={
            <Fragment>
              <Button.Confirm
                disabled={!queue.length}
                color="bad"
                icon="minus-circle"
                content="Clear Queue"
                onClick={() => act("clear_queue")} />
              {(!!isProcessingQueue && (
                <Button
                  disabled={!queue.length}
                  content="Stop"
                  icon="stop"
                  onClick={() => act("stop_queue")} />
              )) || (
                <Button
                  disabled={!queue.length}
                  content="Build Queue"
                  icon="play"
                  onClick={() => act("build_queue")} />
              )}
            </Fragment>
          }>
          <Flex
            direction="column"
            height="100%">
            <Flex.Item>
              <BeingBuilt />
            </Flex.Item>
            <Flex.Item>
              <QueueList
                queue={queue}
                textColors={textColors} />
            </Flex.Item>
          </Flex>
        </Section>
      </Flex.Item>
      {!!queue.length && (
        <Flex.Item mt={1}>
          <Section
            title="Material Cost">
            <QueueMaterials
              queueMaterials={queueMaterials}
              missingMaterials={missingMaterials} />
          </Section>
        </Flex.Item>
      )}
    </Flex>
  );
};

const QueueMaterials = (props, context) => {
  const {
    queueMaterials,
    missingMaterials,
  } = props;

  return (
    <Flex wrap="wrap">
      {Object.keys(queueMaterials).map(material => (
        <Flex.Item
          width="12%"
          key={material}>
          <MaterialAmount
            formatmoney
            name={material}
            amount={queueMaterials[material]} />
          {(!!missingMaterials[material] && (
            <Box
              textColor="bad"
              style={{ "text-align": "center" }}>
              {formatMoney(missingMaterials[material])}
            </Box>
          ))}
        </Flex.Item>
      ))}
    </Flex>
  );
};

const QueueList = (props, context) => {
  const { act, data } = useBackend(context);

  const {
    queue,
    textColors,
  } = props;

  if (!queue.length) {
    return (
      <Fragment>
        No parts in queue.
      </Fragment>
    );
  }

  return (
    queue.map((part, index) => (
      <Box
        key={part.name}>
        <Flex
          mb={0.5}
          direction="column"
          justify="center"
          wrap="wrap"
          height="20px" inline>
          <Flex.Item
            basis="content">
            <Button
              height="20px"
              mr={1}
              icon="minus-circle"
              color="bad"
              onClick={() => act("del_queue_part", { index: index+1 })} />
          </Flex.Item>
          <Flex.Item>
            <Box
              inline
              textColor={COLOR_KEYS[textColors[index]]}>
              {part.name}
            </Box>
          </Flex.Item>
        </Flex>
      </Box>
    ))
  );
};

const BeingBuilt = (props, context) => {
  const { data } = useBackend(context);

  const {
    buildingPart,
    storedPart,
  } = data;

  if (storedPart) {
    const {
      name,
    } = storedPart;

    return (
      <Box>
        <ProgressBar
          minValue={0}
          maxValue={1}
          value={1}
          color="average">
          <Flex>
            <Flex.Item>
              {name}
            </Flex.Item>
            <Flex.Item
              grow={1} />
            <Flex.Item>
              {"Fabricator outlet obstructed..."}
            </Flex.Item>
          </Flex>
        </ProgressBar>
      </Box>
    );
  }

  if (buildingPart) {
    const {
      name,
      duration,
      printTime,
    } = buildingPart;

    const timeLeft = Math.ceil(duration/10);

    return (
      <Box>
        <ProgressBar
          minValue={0}
          maxValue={printTime}
          value={duration}>
          <Flex>
            <Flex.Item>
              {name}
            </Flex.Item>
            <Flex.Item
              grow={1} />
            <Flex.Item>
              {((timeLeft >= 0) && (timeLeft + "s")) || ("Dispensing...")}
            </Flex.Item>
          </Flex>
        </ProgressBar>
      </Box>
    );
  }
};
